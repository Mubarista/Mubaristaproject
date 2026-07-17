import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get("judgeId");

    if (!judgeId) {
      return NextResponse.json({ error: "Missing judgeId" }, { status: 400 });
    }

    const { data: judge, error: judgeError } = await supabaseAdmin
      .from("judge_credentials")
      .select("*")
      .eq("id", judgeId)
      .single();

    if (judgeError || !judge) {
      return NextResponse.json({ error: "Judge not found" }, { status: 404 });
    }

    const assigned = judge.assigned_competition;

    // Support both competition id (uuid) and legacy title assignments
    let competitionQuery = supabaseAdmin.from("competitions").select("*");
    if (assigned) {
      competitionQuery = competitionQuery.or(`id.eq.${assigned},title.ilike.${assigned}`);
    } else {
      competitionQuery = competitionQuery.limit(1);
    }
    const { data: competitionRows, error: compError } = await competitionQuery;
    if (compError) throw compError;

    const competitions = (mapKeysToCamelCase(competitionRows || []) as unknown[]) as Record<string, unknown>[];
    const competition = competitions.length > 0 ? competitions[0] : null;
    const competitionId = competition ? String(competition.id) : null;

    if (!competitionId) {
      return NextResponse.json({
        entries: [],
        stats: { qualified: 0, borderline: 0, pending: 0, total: 0 },
      });
    }

    const { data: applications, error: appsError } = await supabaseAdmin
      .from("competition_applications")
      .select("*")
      .eq("competition_id", competitionId)
      .neq("status", "declined");
    if (appsError) throw appsError;

    const { data: scores, error: scoresError } = await supabaseAdmin
      .from("judge_scores")
      .select("*")
      .eq("competition_id", competitionId);
    if (scoresError) throw scoresError;

    const apps = (mapKeysToCamelCase(applications || []) as unknown[]) as Record<string, unknown>[];
    const rawScores = (scores || []) as Record<string, unknown>[];

    const scoresByApp = new Map<string, Record<string, unknown>[]>();
    rawScores.forEach((s) => {
      const appId = String(s.application_id);
      if (!scoresByApp.has(appId)) {
        scoresByApp.set(appId, []);
      }
      scoresByApp.get(appId)?.push(s);
    });

    const entries = apps
      .map((app) => {
        const appId = String(app.id);
        const appScores = scoresByApp.get(appId) || [];
        const scoreCount = appScores.length;
        const avgScore =
          scoreCount > 0
            ? appScores.reduce((sum, s) => sum + Number(s.score || 0), 0) / scoreCount
            : undefined;

        let status = "pending";
        if (avgScore !== undefined) {
          if (avgScore >= 8) status = "qualified";
          else if (avgScore >= 6) status = "borderline";
          else status = "eliminated";
        }

        return {
          id: appId,
          name: String(app.fullName || app.userName || app.user_name || "Participant"),
          country: String(app.country || "Unknown"),
          flag: "",
          score: avgScore !== undefined ? Math.round(avgScore * 10) / 10 : undefined,
          status,
        };
      })
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
      .map((e, i) => ({ ...e, rank: i + 1 }));

    const stats = {
      qualified: entries.filter((e) => e.status === "qualified").length,
      borderline: entries.filter((e) => e.status === "borderline").length,
      pending: entries.filter((e) => e.status === "pending").length,
      total: entries.length,
    };

    return NextResponse.json({ entries, stats, competitionId });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Not implemented" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Not implemented" }, { status: 405 });
}
