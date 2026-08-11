import { supabaseAdmin } from "@/lib/supabase-admin";

export async function recalculateRanks(competitionId: string) {
  const { data, error } = await supabaseAdmin
    .from("competition_results")
    .select("id, score")
    .eq("competition_id", competitionId)
    .order("score", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const entries = (data || []) as { id: string; score?: number }[];
  const updates = entries.map((entry, i) =>
    supabaseAdmin
      .from("competition_results")
      .update({ rank: i + 1 })
      .eq("id", entry.id)
  );

  await Promise.all(updates);
}
