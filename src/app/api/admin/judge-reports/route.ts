import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from("judge_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportsError) throw reportsError;

    const { data: judges, error: judgesError } = await supabaseAdmin
      .from("judge_credentials")
      .select("id, name");

    if (judgesError) throw judgesError;

    const { data: competitions, error: competitionsError } = await supabaseAdmin
      .from("competitions")
      .select("id, title");

    if (competitionsError) throw competitionsError;

    const judgeMap = new Map((judges || []).map((j) => [j.id, j.name]));
    const competitionMap = new Map((competitions || []).map((c) => [c.id, c.title]));

    const enrichedReports = (mapKeysToCamelCase(reports || []) as Record<string, unknown>[]).map((r) => {
      const judgeId = String(r.judgeId || "");
      const competitionId = r.competitionId ? String(r.competitionId) : null;
      return {
        ...r,
        judgeName: judgeMap.get(judgeId) || "Unknown Judge",
        competitionTitle: competitionId ? competitionMap.get(competitionId) || "Unknown Competition" : "—",
      };
    });

    return NextResponse.json(enrichedReports);
  } catch (error) {
    console.error("Error fetching judge reports:", error);
    return NextResponse.json({ error: "Failed to fetch judge reports" }, { status: 500 });
  }
}
