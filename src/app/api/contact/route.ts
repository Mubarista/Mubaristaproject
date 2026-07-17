import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { validatePhoneNumber } from "@/lib/phone-utils";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("contact_info").select("*").limit(1).single();
    if (error || !data) return NextResponse.json(null);
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error fetching contact info:", error);
    return NextResponse.json(null);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("messages").insert({ ...keysToSnakeCase(body), status: "unread", created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating contact submission:", error);
    return NextResponse.json({ error: "Failed to create contact submission" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (body.phone) {
      const phoneValidation = validatePhoneNumber(body.phone);
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: phoneValidation.error || "Invalid phone number" }, { status: 400 });
      }
    }

    const { data, error } = await supabaseAdmin.from("contact_info").upsert({ id: "contact-1", ...keysToSnakeCase(body), updated_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}
