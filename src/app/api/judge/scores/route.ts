import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { recalculateRanks } from "@/lib/ranking";

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
      .select("status")
      .eq("id", resolvedCompetitionId)
      .single();

    if (compError || !competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    if (competition.status !== "judging") {
      return NextResponse.json({ error: "Judging is not open for this competition" }, { status: 403 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("judge_scores")
      .select("id")
      .eq("judge_id", judgeId)
      .eq("application_id", applicationId)
      .maybeSingle();

    if (existingError) throw existingError;

    const payload = {
      judge_id: judgeId,
      application_id: applicationId,
      competition_id: resolvedCompetitionId,
      participant_name: participantName || null,
      score,
      feedback: comments || null,
      criteria_scores: criteriaScores || {},
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("judge_scores")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("judge_scores")
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Recalculate the average judge score for this application
    const { data: allScores } = await supabaseAdmin
      .from("judge_scores")
      .select("score")
      .eq("application_id", applicationId);

    const judgeScores = (allScores || []).map((s: any) => Number(s.score || 0));
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
      console.error("Failed to notify participant about judge score:", notifyError);
    }

    return NextResponse.json({ success: true, score: result });
  } catch (error) {
    console.error("Error saving judge score:", error);
    return NextResponse.json({ error: "Failed to save judge score" }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ message: "Not implemented" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Not implemented" }, { status: 405 });
}
