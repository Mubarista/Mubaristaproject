import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";
import { createNotification } from "@/lib/notifications";

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
      .select("*, video_path")
      .single();

    if (error) throw error;

    // Delete the uploaded competition video immediately after nomination
    if (data?.video_path) {
      await supabaseAdmin.storage.from("Videos").remove([data.video_path]);
      await supabaseAdmin
        .from("competition_applications")
        .update({ video_url: null, video_path: null, updated_at: now.toISOString() })
        .eq("id", id);
      data.video_url = null;
      data.video_path = null;
    }

    const app = mapKeysToCamelCase(data);
    app.email = app.email || app.userEmail;
    app.fullName = app.fullName || app.userName;

    if (app?.competitionId) {
      const { data: comp } = await supabase
        .from("competitions")
        .select("id, title, entry_fee")
        .eq("id", app.competitionId)
        .single();
      app.competitions = comp ? mapKeysToCamelCase(comp) : null;
    }

    if (app?.userId) {
      createNotification({
        userId: app.userId,
        title: "Congratulations! You have been nominated",
        description: `You have been nominated for ${app.competitions?.title || "a competition"}. Please pay the entry fee within 3 days to confirm your participation.`,
        type: "competition",
        metadata: { applicationId: app.id, competitionId: app.competitionId },
      });
    }

    return NextResponse.json(app);
  } catch (error) {
    console.error("Error nominating application:", error);
    return NextResponse.json({ error: "Failed to nominate application" }, { status: 500 });
  }
}
