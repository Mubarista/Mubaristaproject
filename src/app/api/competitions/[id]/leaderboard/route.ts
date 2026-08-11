import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: competition, error: compError } = await supabaseAdmin
      .from("competitions")
      .select("title, status, event_timeline")
      .eq("id", id)
      .maybeSingle();

    if (compError || !competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const { data: results, error } = await supabaseAdmin
      .from("competition_results")
      .select("*, competition_applications(video_url, full_name, country, profile_photo_url)")
      .eq("competition_id", id)
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
