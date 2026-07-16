import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    const { data, error } = await supabase.from("platform_stats").select("*").limit(1);
    if (error) throw error;
    return NextResponse.json({
      success: true,
      message: "Supabase connected successfully",
      mode: "supabase",
      data,
    });
  } catch (error) {
    console.error("Supabase connection error:", error);
    return NextResponse.json({
      success: false,
      message: "Supabase connection failed - tables may not be created yet",
      mode: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Supabase backend active",
    mode: "supabase",
  });
}
