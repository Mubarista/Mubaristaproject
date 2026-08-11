import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { validatePhoneNumber } from "@/lib/phone-utils";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("competition_applications")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    const app = mapKeysToCamelCase(data);
    app.email = app.email || app.userEmail;
    app.fullName = app.fullName || app.userName;

    if (app?.competitionId) {
      const { data: comp } = await supabase
        .from("competitions")
        .select("id, title, entry_fee")
        .eq("id", app.competitionId)
        .single();
      const mappedComp = comp ? mapKeysToCamelCase(comp) : null;
      app.competitions = mappedComp;
      app.competition = mappedComp;
    }

    return NextResponse.json(app);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.mobileNumber) {
      const phoneValidation = validatePhoneNumber(body.mobileNumber);
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: phoneValidation.error || "Invalid phone number" }, { status: 400 });
      }
    }

    // Map API-level fields to actual table columns and drop enriched/non-column fields
    const { email, fullName, competitions, competition, ...rest } = body;

    // Prevent video re-uploads or modifications after the first submission
    if (rest.videoUrl !== undefined) {
      const { data: existing } = await supabaseAdmin
        .from("competition_applications")
        .select("video_url")
        .eq("id", id)
        .maybeSingle();

      if (existing?.video_url) {
        return NextResponse.json(
          { error: "A video has already been submitted and cannot be modified or re-uploaded." },
          { status: 409 }
        );
      }
    }

    const updatePayload: Record<string, unknown> = keysToSnakeCase(rest);
    if (email !== undefined) updatePayload.user_email = email;
    if (fullName !== undefined) {
      updatePayload.full_name = fullName;
      updatePayload.user_name = fullName;
    }

    const { data, error } = await supabase
      .from("competition_applications")
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;

    // Delete the uploaded competition video immediately on rejection or archival
    if ((data?.status === "rejected" || data?.status === "archived" || data?.status === "revoked") && data?.video_path) {
      await supabaseAdmin.storage.from("Videos").remove([data.video_path]);
      await supabaseAdmin
        .from("competition_applications")
        .update({ video_url: null, video_path: null, updated_at: new Date().toISOString() })
        .eq("id", id);
      data.video_url = null;
      data.video_path = null;
    }

    const updated = mapKeysToCamelCase(data);
    updated.email = updated.email || updated.userEmail;
    updated.fullName = updated.fullName || updated.userName;

    if (updated?.userId && updated?.status && updated?.competitionId) {
      const { data: comp } = await supabase
        .from("competitions")
        .select("title")
        .eq("id", updated.competitionId)
        .single();
      const title = comp?.title || "competition";
      const status = updated.status;

      let notifTitle = "Application update";
      let notifDescription = `Your application for ${title} has been updated.`;
      let notifType = "competition";

      if (status === "rejected") {
        notifTitle = "Application not selected";
        notifDescription = `Your application for ${title} was not selected. Thank you for your interest.`;
        notifType = "warning";
      } else if (status === "active") {
        notifTitle = "Application confirmed";
        notifDescription = `Your application for ${title} is now active. Good luck!`;
        notifType = "confirmation";
      } else if (status === "archived" || status === "revoked") {
        notifTitle = "Application archived";
        notifDescription = `Your application for ${title} has been archived.`;
        notifType = "warning";
      }

      createNotification({
        userId: updated.userId,
        title: notifTitle,
        description: notifDescription,
        type: notifType,
        metadata: { applicationId: updated.id, competitionId: updated.competitionId, status },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: existing } = await supabase
      .from("competition_applications")
      .select("video_path")
      .eq("id", id)
      .single();

    if (existing?.video_path) {
      await supabaseAdmin.storage.from("Videos").remove([existing.video_path]);
    }

    const { error } = await supabase
      .from("competition_applications")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
