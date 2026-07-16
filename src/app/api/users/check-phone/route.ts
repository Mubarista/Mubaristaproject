import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { validatePhoneNumber } from "@/lib/phone-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;
    if (!phone) return NextResponse.json({ exists: false });
    const validation = validatePhoneNumber(phone);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Invalid phone number" }, { status: 400 });
    }
    const { data, error } = await supabase.from("users").select("id").eq("phone", phone).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ exists: !!data });
  } catch (error) {
    console.error("Error checking phone:", error);
    return NextResponse.json({ exists: false });
  }
}
