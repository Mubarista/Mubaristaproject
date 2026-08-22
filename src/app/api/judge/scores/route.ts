import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { recalculateRanks } from "@/lib/ranking";

function isScored(scoreRow: unknown): boolean {
  if (!scoreRow || typeof scoreRow !== "object") return false;
  const row = scoreRow as Record<string, unknown>;
  return row.score !== null && row.score !== undefined && row.score !== "";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get("judgeId");
    const applicationId = searchParams.get("applicationId");

    if (!judgeId || !applicationId) {
      return NextResponse.json({ error: "Missing judgeId or applicationId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("judge_scores")
      .select("*")
      .eq("judge_id", judgeId)
      .eq("application_id", applicationId)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json(data || null);
  } catch (error) {
    console.error("Error fetching judge score:", error);
    return NextResponse.json({ error: "Failed to fetch judge score" }, { status: 500 });
  }
}

async function determineActiveJudge(competitionId: string, applicationId: string) {
  const { data: competition } = await supabaseAdmin
    .from("competitions")
    .select("title")
    .eq("id", competitionId)
    .maybeSingle();

  const competitionTitle = competition ? String((competition as any).title || "").replace(/'/g, "''") : "";
  const judgeQuery = competitionTitle
    ? supabaseAdmin.from("judge_credentials").select("id, name, active, created_at").or(`assigned_competition.eq.${competitionId},assigned_competition.ilike.${competitionTitle}`).order("created_at", { ascending: true })
    : supabaseAdmin.from("judge_credentials").select("id, name, active, created_at").eq("assigned_competition", competitionId).order("created_at", { ascending: true });

  const { data: allJudges } = await judgeQuery;
  const activeJudges = (allJudges || []).filter((j: any) => j.active !== false).sort((a: any, b: any) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return aTime - bTime;
  });

  const { data: appScores } = await supabaseAdmin
    .from("judge_scores")
    .select("judge_id, score")
    .eq("application_id", applicationId);

  const scoredJudgeIds = new Set(
    (appScores || [])
      .filter((s: any) => s.score !== null && s.score !== undefined && s.score !== "")
      .map((s: any) => s.judge_id)
  );

  return activeJudges.find((j: any) => !scoredJudgeIds.has(j.id)) || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { judgeId, applicationId, competitionId, participantName, score, comments, criteriaScores } = body;

    if (!judgeId || !applicationId || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const resolvedCompetitionId = competitionId || (
      await supabaseAdmin
        .from("competition_applications")
        .select("competition_id")
        .eq("id", applicationId)
        .maybeSingle()
    ).data?.competition_id;

    if (!resolvedCompetitionId) {
      return NextResponse.json({ error: "Competition not found for this application" }, { status: 404 });
    }

    const { data: competition, error: compError } = await supabaseAdmin
      .from("competitions")
      .select("status, title")
      .eq("id", resolvedCompetitionId)
      .single();

    if (compError || !competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    if ((competition as any).status !== "judging") {
      return NextResponse.json({ error: "Judging is not open for this competition" }, { status: 403 });
    }

    // Prevent scoring already-submitted scores (no undo)
    const { data: existing } = await supabaseAdmin
      .from("judge_scores")
      .select("id")
      .eq("judge_id", judgeId)
      .eq("application_id", applicationId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already scored this participant. Scores cannot be changed or undone." },
        { status: 409 }
      );
    }

    // Turn-based: only the active judge may submit
    const activeJudge = await determineActiveJudge(resolvedCompetitionId, applicationId);
    if (!activeJudge || activeJudge.id !== judgeId) {
      const nextName = activeJudge ? String(activeJudge.name) : "another judge";
      return NextResponse.json(
        { error: `Please wait. It is currently ${nextName}'s turn to score this participant.` },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("judge_scores")
      .insert({
        judge_id: judgeId,
        application_id: applicationId,
        competition_id: resolvedCompetitionId,
        participant_name: participantName || null,
        score,
        feedback: comments || null,
        criteria_scores: criteriaScores || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate the average judge score for this application
    const { data: appScores } = await supabaseAdmin
      .from("judge_scores")
      .select("score")
      .eq("application_id", applicationId);

    const judgeScores = (appScores || []).map((s: any) => Number(s.score || 0));
    const averageJudgeScore = judgeScores.length > 0
      ? judgeScores.reduce((sum, s) => sum + s, 0) / judgeScores.length
      : 0;

    const { data: resultRow } = await supabaseAdmin
      .from("competition_results")
      .select("vote_points")
      .eq("application_id", applicationId)
      .maybeSingle();

    const votePoints = (resultRow?.vote_points as number) || 0;
    const finalScore = votePoints + averageJudgeScore;

    const { error: resultError } = await supabaseAdmin
      .from("competition_results")
      .upsert({
        competition_id: resolvedCompetitionId,
        application_id: applicationId,
        participant_name: participantName || "Participant",
        judge_score: averageJudgeScore,
        vote_points: votePoints,
        score: finalScore,
        rank: 0,
        feedback: comments || "",
      }, { onConflict: "application_id" });

    if (resultError) {
      console.error("Error updating competition results from judge score:", resultError);
    } else {
      await recalculateRanks(resolvedCompetitionId);
    }

    // Notify the participant that a judge has scored their application
    try {
      const { data: app } = await supabaseAdmin
        .from("competition_applications")
        .select("user_id")
        .eq("id", applicationId)
        .maybeSingle();

      if (app?.user_id) {
        await createNotification({
          userId: app.user_id,
          title: "Your application was scored",
          description: `A judge gave your submission a score of ${score}/10.`,
          type: "competition",
          metadata: { applicationId, competitionId: resolvedCompetitionId, score },
        });
      }
    } catch (notifyError) {
      console.error("Failed to notify participant about judge score:", error);
    }

    return NextResponse.json({ success: true, score: data });
  } catch (error) {
    console.error("Error saving judge score:", error);
    return NextResponse.json({ error: "Failed to save judge score" }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ error: "Scores cannot be updated once submitted" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Scores cannot be deleted" }, { status: 405 });
}