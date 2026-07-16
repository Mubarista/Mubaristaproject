import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
