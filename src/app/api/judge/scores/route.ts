import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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
      competition_id: competitionId || null,
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
