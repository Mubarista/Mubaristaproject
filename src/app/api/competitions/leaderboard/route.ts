import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const competitionId = searchParams.get("competitionId");

    if (!slug && !competitionId) {
      return NextResponse.json({ error: "Missing slug or competitionId" }, { status: 400 });
    }

    let resolvedId = competitionId;
    if (!resolvedId && slug) {
      const { data: comp } = await supabaseAdmin
        .from("competitions")
        .select("id, title, status, event_timeline")
        .ilike("slug", slug)
        .maybeSingle();
      if (!comp) {
        return NextResponse.json({ error: "Competition not found" }, { status: 404 });
      }
      resolvedId = comp.id;
    }

    const { data: competition } = await supabaseAdmin
      .from("competitions")
      .select("id, title, status, event_timeline")
      .eq("id", resolvedId)
      .single();

    const { data: results, error } = await supabaseAdmin
      .from("competition_results")
      .select("*, competition_applications(video_url, full_name, country, profile_photo_url)")
      .eq("competition_id", resolvedId)
      .order("score", { ascending: false })
      .order("vote_points", { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }

    const mapped = (mapKeysToCamelCase(results) || []) as any[];
    const leaderboard = mapped.map((r, i) => ({
      ...r,
      rank: i + 1,
      videoUrl: r.competitionApplications?.videoUrl || "",
      fullName: r.competitionApplications?.fullName || r.participantName || "Participant",
      country: r.competitionApplications?.country || "",
      profilePhotoUrl: r.competitionApplications?.profilePhotoUrl || "",
    }));

    return NextResponse.json({
      competition: mapKeysToCamelCase(competition),
      leaderboard,
    });
  } catch (error: any) {
    console.error("Error in leaderboard route:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
