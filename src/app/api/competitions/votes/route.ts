import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";
import { recalculateRanks } from "@/lib/ranking";

const POINTS_PER_VOTE = 3;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Please log in to vote" }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing application ID" }, { status: 400 });
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from("competition_applications")
      .select("*, competitions(id, status, title)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const app = mapKeysToCamelCase(application) as any;
    const competitionStatus = app.competitions?.status;

    if (competitionStatus !== "voting") {
      return NextResponse.json({ error: "Voting is not open for this competition" }, { status: 403 });
    }

    // One vote per user per application
    const { data: existingVote } = await supabaseAdmin
      .from("competition_votes")
      .select("id")
      .eq("application_id", applicationId)
      .eq("voter_id", authData.user.id)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json({ error: "You have already voted for this applicant" }, { status: 409 });
    }

    const now = new Date().toISOString();

    const { error: voteError } = await supabaseAdmin.from("competition_votes").insert({
      competition_id: app.competitionId,
      application_id: applicationId,
      voter_id: authData.user.id,
      points: POINTS_PER_VOTE,
      created_at: now,
    });

    if (voteError) {
      console.error("Error inserting vote:", voteError);
      return NextResponse.json({ error: "Failed to register vote" }, { status: 500 });
    }

    // Recalculate vote points for this application
    const { count } = await supabaseAdmin
      .from("competition_votes")
      .select("*", { count: "exact", head: true })
      .eq("application_id", applicationId);

    const votePoints = (count || 0) * POINTS_PER_VOTE;

    const { data: result } = await supabaseAdmin
      .from("competition_results")
      .select("judge_score")
      .eq("application_id", applicationId)
      .maybeSingle();

    const judgeScore = (result?.judge_score as number) || 0;
    const finalScore = votePoints + judgeScore;

    const { error: resultError } = await supabaseAdmin
      .from("competition_results")
      .update({ vote_points: votePoints, judge_score: judgeScore, score: finalScore })
      .eq("application_id", applicationId);

    if (resultError) {
      console.error("Error updating competition results:", resultError);
    } else {
      await recalculateRanks(app.competitionId);
    }

    return NextResponse.json({
      success: true,
      votePoints,
      judgeScore,
      finalScore,
    });
  } catch (error: any) {
    console.error("Error in votes route:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
