import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId");

    if (!competitionId) {
      return NextResponse.json({ error: "Missing competitionId" }, { status: 400 });
    }

    const { data: competition } = await supabaseAdmin
      .from("competitions")
      .select("title")
      .eq("id", competitionId)
      .maybeSingle();

    const competitionTitle = competition ? String((competition as any).title).replace(/'/g, "''") : "";
    const judgeQuery = competitionTitle
      ? supabaseAdmin.from("judge_credentials").select("id, active").or(`assigned_competition.eq.${competitionId},assigned_competition.ilike.${competitionTitle}`)
      : supabaseAdmin.from("judge_credentials").select("id, active").eq("assigned_competition", competitionId);

    const { data: allJudges } = await judgeQuery;
    const totalJudges = Math.max((allJudges || []).filter((j: any) => j.active !== false).length, 1);

    const { data: applications } = await supabaseAdmin
      .from("competition_applications")
      .select("id, full_name, video_url, scoring_order, created_at")
      .eq("competition_id", competitionId)
      .neq("status", "declined")
      .order("scoring_order", { ascending: true })
      .order("created_at", { ascending: true });

    const { data: allScores } = await supabaseAdmin
      .from("judge_scores")
      .select("application_id, score, judge_id")
      .eq("competition_id", competitionId);

    const { data: results } = await supabaseAdmin
      .from("competition_results")
      .select("application_id, score, rank")
      .eq("competition_id", competitionId);

    const scoresByApp = new Map<string, number>();
    const judgesByApp = new Map<string, string[]>();
    (allScores || []).forEach((s: any) => {
      const appId = String(s.application_id);
      if (s.score !== null && s.score !== undefined && s.score !== "") {
        scoresByApp.set(appId, (scoresByApp.get(appId) || 0) + Number(s.score));
        if (!judgesByApp.has(appId)) judgesByApp.set(appId, []);
        judgesByApp.get(appId)?.push(String(s.judge_id));
      }
    });

    const resultByApp = new Map<string, any>();
    (results || []).forEach((r: any) => {
      resultByApp.set(String(r.application_id), r);
    });

    const queue = (applications || []).map((app: any) => {
      const appId = String(app.id);
      const judgeCount = (judgesByApp.get(appId) || []).length;
      const totalScore = scoresByApp.get(appId) || 0;
      const average = judgeCount > 0 ? totalScore / judgeCount : 0;
      const result = resultByApp.get(appId);
      return {
        applicationId: appId,
        name: String(app.full_name || "Participant"),
        videoUrl: String(app.video_url || ""),
        scoredCount: judgeCount,
        totalJudges,
        completed: judgeCount >= totalJudges,
        averageScore: Number(average.toFixed(1)),
        finalScore: result ? Number(result.score || 0).toFixed(1) : average.toFixed(1),
        rank: result ? Number(result.rank || 0) : 0,
      };
    });

    const completed = queue.filter((q: any) => q.completed);
    const pending = queue.filter((q: any) => !q.completed);
    const current = pending[0] || null;
    const next = pending[1] || null;

    // Determine the leaderboard view: if all completed, sort by final score; otherwise show queue order
    const isComplete = queue.every((q: any) => q.completed);
    const leaderboard = isComplete
      ? [...queue].sort((a: any, b: any) => Number(b.finalScore) - Number(a.finalScore))
      : [current, ...pending.slice(1), ...completed].filter(Boolean);

    return NextResponse.json({
      isComplete,
      totalJudges,
      current,
      next,
      queue,
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching scoring queue:", error);
    return NextResponse.json({ error: "Failed to fetch scoring queue" }, { status: 500 });
  }
}