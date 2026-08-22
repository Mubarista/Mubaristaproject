import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { judgeId } = body;

    if (!judgeId) {
      return NextResponse.json({ error: "Missing judgeId" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("judge_credentials")
      .update({ terms_accepted_at: now, updated_at: now })
      .eq("id", judgeId)
      .select()
      .single();

    if (error) {
      console.error("Error accepting terms:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      termsAcceptedAt: data.terms_accepted_at,
    });
  } catch (error) {
    console.error("Error in accept-terms:", error);
    return NextResponse.json({ error: "Failed to accept terms" }, { status: 500 });
  }
}