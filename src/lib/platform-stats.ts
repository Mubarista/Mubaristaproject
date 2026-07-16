import { supabaseAdmin } from "@/lib/supabase";

export async function computePlatformStats() {
  // Count live competitions (open, upcoming, or judging)
  const { count: liveCompetitionsCount, error: competitionsError } = await supabaseAdmin
    .from("competitions")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "upcoming", "judging"]);

  if (competitionsError) {
    console.error("Error counting competitions:", competitionsError);
  }

  // Count total participants from competition applications
  const { count: totalParticipantsCount, error: participantsError } = await supabaseAdmin
    .from("competition_applications")
    .select("*", { count: "exact", head: true });

  if (participantsError) {
    console.error("Error counting participants:", participantsError);
  }

  // Count distinct countries from competition applications
  const { data: countriesData, error: countriesError } = await supabaseAdmin
    .from("competition_applications")
    .select("country", { count: "exact", head: false })
    .not("country", "is", null);

  if (countriesError) {
    console.error("Error counting countries:", countriesError);
  }

  const uniqueCountries = new Set((countriesData || []).map((u: any) => u.country).filter(Boolean));

  // Count total winners
  const { count: totalWinnersCount, error: winnersError } = await supabaseAdmin
    .from("winners")
    .select("*", { count: "exact", head: true });

  if (winnersError) {
    console.error("Error counting winners:", winnersError);
  }

  return {
    liveCompetitions: liveCompetitionsCount || 0,
    totalParticipants: totalParticipantsCount || 0,
    countriesJoined: uniqueCountries.size,
    totalWinners: totalWinnersCount || 0,
  };
}
