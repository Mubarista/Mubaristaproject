import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email) return NextResponse.json({ exists: false });
    const { data, error } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ exists: !!data });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json({ exists: false });
  }
}
