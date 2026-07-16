import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { computePlatformStats } from "@/lib/platform-stats";

export async function GET() {
  try {
    const computed = await computePlatformStats();

    // Get platform stats from database to preserve other fields if any
    const { data, error } = await supabaseAdmin.from("platform_stats").select("*").limit(1).single();

    if (error || !data) {
      return NextResponse.json(computed);
    }

    const stats = mapKeysToCamelCase(data);
    return NextResponse.json({
      ...stats,
      ...computed,
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return NextResponse.json({ liveCompetitions: 0, totalParticipants: 0, countriesJoined: 0, totalWinners: 0 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const computed = await computePlatformStats();

    // Merge body with computed stats, computed wins for live platform data
    const updateData = {
      ...keysToSnakeCase(body),
      live_competitions: computed.liveCompetitions,
      total_participants: computed.totalParticipants,
      countries_joined: computed.countriesJoined,
      total_winners: computed.totalWinners,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("platform_stats").upsert({ id: "stats-1", ...updateData }).select().single();
    if (error) throw error;

    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating platform stats:", error);
    return NextResponse.json({ error: "Failed to update platform stats" }, { status: 500 });
  }
}
