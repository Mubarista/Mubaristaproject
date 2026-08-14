import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const competitionId = searchParams.get("competitionId");

    if (!slug && !competitionId) {
      // Global live leaderboard across currently live competitions
      const LIVE_STATUSES = [
        "Registration Open",
        "in_progress",
        "voting",
        "judging",
        "winner_announcement",
      ];

      const { data: liveCompetitions, error: compError } = await supabaseAdmin
        .from("competitions")
        .select("id, title, status")
        .in("status", LIVE_STATUSES);

      if (compError) {
        console.error("Global leaderboard competition fetch error:", compError);
        return NextResponse.json({ error: "Failed to fetch live competitions" }, { status: 500 });
      }

      if (!liveCompetitions || liveCompetitions.length === 0) {
        return NextResponse.json({ available: false, leaderboard: [] });
      }

      const liveIds = liveCompetitions.map((c: any) => c.id);
      const compMap = new Map(liveCompetitions.map((c: any) => [c.id, c.title]));

      const { data: applications, error: appError } = await supabaseAdmin
        .from("competition_applications")
        .select("id, full_name, country, competition_id, profile_photo_url")
        .in("competition_id", liveIds);

      if (appError) {
        console.error("Global leaderboard applications error:", appError);
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
      }

      const { data: results, error: resultError } = await supabaseAdmin
        .from("competition_results")
        .select("application_id, vote_points, score, rank")
        .in("competition_id", liveIds);

      if (resultError) {
        console.error("Global leaderboard results error:", resultError);
      }

      const resultMap = new Map((results || []).map((r: any) => [r.application_id, r]));

      const leaderboard = (applications || [])
        .map((app: any) => {
          const result = resultMap.get(app.id);
          return {
            id: app.id,
            fullName: app.full_name || "Participant",
            country: app.country || "",
            competitionTitle: compMap.get(app.competition_id) || "Unknown Competition",
            profilePhotoUrl: app.profile_photo_url || "",
            votes: Math.round((result?.vote_points || 0) / 3),
            totalScore: result?.score || 0,
            rank: result?.rank || 0,
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore || b.votes - a.votes)
        .map((item, index) => ({ ...item, rank: index + 1 }));

      return NextResponse.json({ available: true, leaderboard });
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
