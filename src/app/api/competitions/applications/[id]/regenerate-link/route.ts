import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

const ACCESS_LINK_VALID_DAYS = 3;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ACCESS_LINK_VALID_DAYS * 24 * 60 * 60 * 1000);
    const token = randomUUID().replace(/-/g, "");

    const { data, error } = await supabaseAdmin
      .from("competition_applications")
      .update({
        access_link: token,
        access_link_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", id)
      .select("*, competitions:competition_id (id, title, entry_fee)")
      .single();

    if (error || !data) {
      console.error("Regenerate link error:", error);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const app = mapKeysToCamelCase(data);
    app.email = app.email || app.userEmail;
    app.fullName = app.fullName || app.userName;
    return NextResponse.json(app);
  } catch (error) {
    console.error("Error regenerating access link:", error);
    return NextResponse.json({ error: "Failed to regenerate access link" }, { status: 500 });
  }
}
