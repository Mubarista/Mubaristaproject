import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import type { CompetitionResult } from "@/types";

export async function GET() {
  try {
    const { data, error } = await supabase.from("competition_results").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const mapped = mapKeysToCamelCase(data) || [];
    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching competition results:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase.from("competition_results").insert({ ...keysToSnakeCase(body), created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating competition result:", error);
    return NextResponse.json({ error: "Failed to create competition result" }, { status: 500 });
  }
}
