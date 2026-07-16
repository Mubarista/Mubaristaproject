import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "missing_token" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("competition_applications")
      .select("*")
      .eq("access_link", token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "invalid" }, { status: 404 });
    }

    const app = mapKeysToCamelCase(data);

    // Check if the application has been revoked
    if (app.status === "revoked" || app.status === "rejected" || app.status === "archived") {
      return NextResponse.json({ error: "revoked" }, { status: 403 });
    }

    // Check expiry
    if (app.accessLinkExpiresAt && new Date(app.accessLinkExpiresAt) < new Date()) {
      return NextResponse.json({ error: "expired" }, { status: 403 });
    }

    // Attach competition details
    if (app.competitionId) {
      const { data: comp } = await supabaseAdmin
        .from("competitions")
        .select("id, title, entry_fee")
        .eq("id", app.competitionId)
        .single();
      app.competition = comp ? mapKeysToCamelCase(comp) : null;
    }

    return NextResponse.json(app);
  } catch (error) {
    console.error("Error validating access link:", error);
    return NextResponse.json({ error: "invalid" }, { status: 500 });
  }
}
