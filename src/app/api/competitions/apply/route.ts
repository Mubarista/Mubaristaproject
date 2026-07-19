import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";
import { validatePhoneNumber } from "@/lib/phone-utils";
import type { CompetitionApplication, Competition } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const userEmail = searchParams.get("userEmail");

    let query = supabaseAdmin.from("competition_applications").select("*");
    const conditions = [];
    if (userId) conditions.push(`user_id.eq.${userId}`);
    if (userEmail) conditions.push(`user_email.ilike.${userEmail}`);
    if (conditions.length > 0) {
      query = query.or(conditions.join(","));
    }
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const apps = (mapKeysToCamelCase(data) || []) as CompetitionApplication[];

    // Fetch related competitions separately (no FK relationship defined)
    const competitionIds = [...new Set(apps.map((a) => a.competitionId).filter(Boolean))];
    let competitionsMap: Record<string, Competition> = {};
    if (competitionIds.length > 0) {
      const { data: comps } = await supabaseAdmin
        .from("competitions")
        .select("id, title, entry_fee")
        .in("id", competitionIds);
      if (comps) {
        competitionsMap = Object.fromEntries(
          (mapKeysToCamelCase(comps) as Competition[]).map((c) => [c.id, c])
        );
      }
    }

    const enriched = apps.map((a) => ({
      ...a,
      email: a.email || a.userEmail,
      fullName: a.fullName || a.userName,
      competitions: (a.competitionId && competitionsMap[a.competitionId]) || null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching competition applications:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check competition status and available slots before accepting applications
    const { data: competition, error: competitionError } = await supabaseAdmin
      .from("competitions")
      .select("difficulty, status, total_slots, available_slots")
      .eq("id", body.competitionId)
      .single();

    if (competitionError) {
      console.error("Error fetching competition status:", competitionError);
      return NextResponse.json({ error: "Failed to verify competition status" }, { status: 500 });
    }

    if (competition?.status === "completed") {
      return NextResponse.json({ error: "This competition has already ended and no longer accepts applications" }, { status: 403 });
    }

    if (competition?.status === "judging") {
      return NextResponse.json({ error: "Applications are closed. Judging is in progress." }, { status: 403 });
    }

    const totalSlots = competition?.total_slots ?? 0;
    const availableSlots = competition?.available_slots ?? 0;

    const { count: applicationsCount, error: countError } = await supabaseAdmin
      .from("competition_applications")
      .select("*", { count: "exact", head: true })
      .eq("competition_id", body.competitionId);

    if (countError) {
      console.error("Error counting applications:", countError);
      return NextResponse.json({ error: "Failed to verify competition availability" }, { status: 500 });
    }

    const currentApplications = applicationsCount ?? 0;

    if (currentApplications >= totalSlots || availableSlots <= 0) {
      return NextResponse.json({ error: "This competition is full. All slots have been filled." }, { status: 403 });
    }

    // Validate birth date server-side and ensure minimum age of 18
    if (body.birthDate) {
      const birthDate = new Date(body.birthDate);
      const today = new Date();
      if (isNaN(birthDate.getTime()) || birthDate > today) {
        return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      if (adjustedAge < 18) {
        return NextResponse.json({ error: "You must be at least 18 years old to apply" }, { status: 400 });
      }
    }

    if (!body.over18) {
      return NextResponse.json({ error: "You must confirm you are 18 years or older" }, { status: 400 });
    }
    if (!body.gender) {
      return NextResponse.json({ error: "Gender is required" }, { status: 400 });
    }

    const phoneValidation = validatePhoneNumber(body.mobileNumber);
    if (!phoneValidation.valid) {
      return NextResponse.json({ error: phoneValidation.error || "Invalid phone number" }, { status: 400 });
    }

    // Prevent duplicate applications by email or mobile number for the same competition
    const normalizedEmail = body.email?.toLowerCase().trim();
    const normalizedMobile = body.mobileNumber?.trim();
    if (normalizedEmail || normalizedMobile) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("competition_applications")
        .select("id")
        .eq("competition_id", body.competitionId)
        .or(`user_email.ilike.${normalizedEmail},mobile_number.eq.${normalizedMobile}`)
        .maybeSingle();

      if (existingError) {
        console.error("Duplicate check error:", existingError);
      } else if (existing) {
        return NextResponse.json(
          { error: "An application with this email or mobile number already exists for this competition" },
          { status: 409 }
        );
      }
    }

    // Enforce competition difficulty as the applicant's chosen experience level.
    // Applicants may not apply to a competition below their highest previous level.
    const LEVELS = ["Beginner", "Intermediate", "Professional", "Master"];
    const levelIndex = (level: string) => {
      const normalized = String(level || "").trim().toLowerCase();
      const map: Record<string, number> = {
        beginner: 0,
        intermediate: 1,
        advanced: 2,
        professional: 2,
        expert: 3,
        master: 3,
      };
      return map[normalized] ?? -1;
    };

    const newLevelIndex = levelIndex(competition?.difficulty);
    if (newLevelIndex === -1) {
      return NextResponse.json({ error: "Competition difficulty is not valid" }, { status: 500 });
    }

    let highestIndex = -1;
    if (normalizedEmail || normalizedMobile) {
      const { data: previous } = await supabaseAdmin
        .from("competition_applications")
        .select("experience")
        .or(`user_email.ilike.${normalizedEmail},mobile_number.eq.${normalizedMobile}`);

      if (previous) {
        highestIndex = previous.reduce((max, app) => Math.max(max, levelIndex(app.experience)), -1);
      }
    }

    if (newLevelIndex < highestIndex) {
      return NextResponse.json(
        {
          error: `You cannot downgrade. Your highest recorded level is ${LEVELS[highestIndex]}. You can only apply to ${LEVELS[highestIndex]} or higher competitions.`,
        },
        { status: 403 }
      );
    }

    const applicationExperience = LEVELS[newLevelIndex];

    const { data, error } = await supabaseAdmin.from("competition_applications").insert({
      competition_id: body.competitionId,
      user_id: body.userId,
      user_name: body.fullName,
      user_email: body.email,
      full_name: body.fullName,
      country: body.country,
      mobile_number: body.mobileNumber,
      birth_date: body.birthDate,
      gender: body.gender,
      over18: body.over18,
      experience: applicationExperience,
      skills: body.skills,
      motivation: body.motivation,
      video_url: body.videoUrl,
      profile_photo_url: body.profilePhotoUrl,
      status: "pending",
      payment_status: "unpaid",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    // Update available slots and status after successful application
    const newApplicationsCount = currentApplications + 1;
    const newAvailableSlots = Math.max(0, totalSlots - newApplicationsCount);
    const newStatus = newAvailableSlots === 0 ? "judging" : competition?.status;

    const { error: updateError } = await supabaseAdmin
      .from("competitions")
      .update({
        available_slots: newAvailableSlots,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.competitionId);

    if (updateError) {
      console.error("Error updating competition slots:", updateError);
    }

    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating competition application:", error);
    return NextResponse.json({ error: "Failed to create competition application" }, { status: 500 });
  }
}
