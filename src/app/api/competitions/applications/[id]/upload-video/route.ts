import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { videoUrl, videoPath } = body;

    if (!videoUrl || !videoPath) {
      return NextResponse.json({ error: "Missing video URL or path" }, { status: 400 });
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from("competition_applications")
      .select("*, competitions(id, status, title)")
      .eq("id", id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const app = mapKeysToCamelCase(application) as any;
    const competitionStatus = app.competitions?.status;
    const userId = app.userId;

    if (competitionStatus !== "in_progress") {
      return NextResponse.json({ error: "Video upload is not open yet" }, { status: 403 });
    }

    if (app.status !== "nominated" && app.status !== "approved") {
      return NextResponse.json({ error: "Only nominated applicants can upload a video" }, { status: 403 });
    }

    if (userId !== authData.user.id) {
      return NextResponse.json({ error: "You can only upload your own video" }, { status: 403 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("competition_applications")
      .update({
        video_url: videoUrl,
        video_path: videoPath,
        video_uploaded_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error uploading competition video:", error);
      return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
    }

    // Ensure a result row exists for this applicant
    const { data: existingResult } = await supabaseAdmin
      .from("competition_results")
      .select("id")
      .eq("application_id", id)
      .maybeSingle();

    if (!existingResult) {
      await supabaseAdmin.from("competition_results").insert({
        competition_id: app.competitionId,
        application_id: id,
        participant_name: app.fullName || app.userName || "Participant",
        vote_points: 0,
        judge_score: 0,
        score: 0,
        rank: 0,
        feedback: "",
        created_at: now,
      });
    }

    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    console.error("Error in upload video route:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
