import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("about").select("*").limit(1).single();
    if (error || !data) {
      return NextResponse.json(null);
    }
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error fetching about:", error);
    return NextResponse.json(null);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("about").upsert({
      id: "about-1",
      ...keysToSnakeCase(body),
      updated_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating about:", error);
    return NextResponse.json({ error: "Failed to update about" }, { status: 500 });
  }
}
