import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId");

    if (!competitionId) {
      return NextResponse.json({ error: "Missing competitionId" }, { status: 400 });
    }

    // Get all active judges for this competition, ordered by created_at for turn order
    const { data: competition } = await supabaseAdmin
      .from("competitions")
      .select("title")
      .eq("id", competitionId)
      .maybeSingle();

    const competitionTitle = competition ? String((competition as any).title).replace(/'/g, "''") : "";
    const judgeQuery = competitionTitle
      ? supabaseAdmin.from("judge_credentials").select("id, name, active, created_at").or(`assigned_competition.eq.${competitionId},assigned_competition.ilike.${competitionTitle}`).order("created_at", { ascending: true })
      : supabaseAdmin.from("judge_credentials").select("id, name, active, created_at").eq("assigned_competition", competitionId).order("created_at", { ascending: true });

    const { data: allJudges } = await judgeQuery;
    const activeJudges = (allJudges || []).filter((j: any) => j.active !== false);
    const totalJudges = Math.max(activeJudges.length, 1);

    // Get applications ordered by scoring order
    const { data: applications } = await supabaseAdmin
      .from("competition_applications")
      .select("id, full_name, video_url, scoring_order, created_at")
      .eq("competition_id", competitionId)
      .neq("status", "declined")
      .order("scoring_order", { ascending: true })
      .order("created_at", { ascending: true });

    // Count submitted scores per application
    const { data: allScores } = await supabaseAdmin
      .from("judge_scores")
      .select("application_id, judge_id, score")
      .eq("competition_id", competitionId);

    const scoresByApp = new Map<string, number>();
    (allScores || []).forEach((s: any) => {
      const appId = String(s.application_id);
      if (s.score !== null && s.score !== undefined && s.score !== "") {
        scoresByApp.set(appId, (scoresByApp.get(appId) || 0) + 1);
      }
    });

    // Determine current active application and current judge's turn
    let currentApp: any = null;
    for (const app of (applications || [])) {
      const appId = String((app as any).id);
      const scoredCount = scoresByApp.get(appId) || 0;
      if (scoredCount < totalJudges) {
        currentApp = app;
        break;
      }
    }

    if (!currentApp) {
      return NextResponse.json({ current: null, completed: true });
    }

    const currentAppId = String((currentApp as any).id);
    const appScores = (allScores || []).filter((s: any) => String(s.application_id) === currentAppId && s.score !== null && s.score !== undefined && s.score !== "");
    const scoredJudgeIds = new Set(appScores.map((s: any) => s.judge_id));
    const currentJudge = activeJudges.find((j: any) => !scoredJudgeIds.has(j.id)) || null;

    const videoUrl = String(currentApp.video_url || "");
    const fullName = String(currentApp.full_name || "Participant");

    return NextResponse.json({
      current: {
        applicationId: currentAppId,
        participantName: fullName,
        videoUrl,
        completed: false,
        currentJudge: currentJudge ? { id: currentJudge.id, name: currentJudge.name } : null,
        judgesDone: appScores.length,
        totalJudges,
      },
      completed: false,
    });
  } catch (error) {
    console.error("Error fetching current scoring video:", error);
    return NextResponse.json({ error: "Failed to fetch current scoring video" }, { status: 500 });
  }
}