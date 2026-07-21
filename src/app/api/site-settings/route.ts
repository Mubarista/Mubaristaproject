import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("site_settings").select("*").limit(1).maybeSingle();
    if (error || !data) {
      return NextResponse.json({
        learnBadgeText: "Education",
        learnTitle: "Learning Center",
        learnDescription: "Free educational content for baristas at every level. Upgrade for premium courses and certifications.",
        termsContent: "",
      });
    }
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json({});
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("site_settings").upsert({ id: "settings-1", ...keysToSnakeCase(body), updated_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json({ error: "Failed to update site settings" }, { status: 500 });
  }
}
