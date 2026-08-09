import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ viewedFactIds: [] });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ viewedFactIds: [] }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("coffee_fact_views")
      .select("fact_id")
      .eq("user_id", authData.user.id);

    if (error) throw error;

    const viewedFactIds = data?.map((row) => row.fact_id) || [];
    return NextResponse.json({ viewedFactIds });
  } catch (error: any) {
    console.error("Error fetching coffee fact views:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { factId } = body;

    if (!factId) {
      return NextResponse.json({ error: "Missing fact ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("coffee_fact_views").upsert(
      { user_id: authData.user.id, fact_id: factId, viewed_at: new Date().toISOString() },
      { onConflict: "user_id, fact_id" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking coffee fact view:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
