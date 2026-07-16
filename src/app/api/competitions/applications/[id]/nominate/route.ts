import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

const ACCESS_LINK_VALID_DAYS = 3;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = randomUUID().replace(/-/g, "");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ACCESS_LINK_VALID_DAYS * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("competition_applications")
      .update({
        status: "nominated",
        access_link: token,
        access_link_expires_at: expiresAt.toISOString(),
        nominated_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const app = mapKeysToCamelCase(data);

    if (app?.competitionId) {
      const { data: comp } = await supabase
        .from("competitions")
        .select("id, title, entry_fee")
        .eq("id", app.competitionId)
        .single();
      app.competitions = comp ? mapKeysToCamelCase(comp) : null;
    }

    return NextResponse.json(app);
  } catch (error) {
    console.error("Error nominating application:", error);
    return NextResponse.json({ error: "Failed to nominate application" }, { status: 500 });
  }
}
