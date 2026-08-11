import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

function averageCriteriaScores(scores: Record<string, unknown>[]): Record<string, number> {
  if (scores.length === 0) return {};

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const score of scores) {
    const criteria = (score.criteria_scores as Record<string, number>) || {};
    for (const [key, value] of Object.entries(criteria)) {
      if (typeof value === "number" && !Number.isNaN(value)) {
        sums[key] = (sums[key] || 0) + value;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }

  const averages: Record<string, number> = {};
  for (const key of Object.keys(sums)) {
    averages[key] = Math.round((sums[key] / counts[key]) * 10) / 10;
  }

  return averages;
}

function medalForRank(rank: number, isFinal: boolean): "gold" | "diamond" | "silver" | undefined {
  if (!isFinal) return undefined;
  if (rank === 1) return "gold";
  if (rank === 2) return "diamond";
  if (rank === 3) return "silver";
  return undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId");

    if (!competitionId) {
      return NextResponse.json({ error: "Missing competitionId" }, { status: 400 });
    }

    const { data: competition, error: compError } = await supabaseAdmin
      .from("competitions")
      .select("status")
      .eq("id", competitionId)
      .maybeSingle();

    if (compError) throw compError;

    const isFinal =
      competition?.status === "winner_announcement" || competition?.status === "ended";

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

        const criteriaScores = averageCriteriaScores(appScores);
        const firstFeedback = appScores.length > 0 ? (appScores[0].feedback as string) || "" : "";

        return {
          id: appId,
          participantName: String(app.fullName || app.userName || app.user_name || "Participant"),
          videoUrl: app.videoUrl ? String(app.videoUrl) : undefined,
          userName: String(app.userName || app.user_name || ""),
          country: String(app.country || "Unknown"),
          flag: "",
          score: avgScore !== undefined ? Math.round(avgScore * 10) / 10 : undefined,
          rank: 0,
          status,
          isWinner: false,
          medal: undefined as "gold" | "diamond" | "silver" | undefined,
          feedback: firstFeedback,
          criteriaScores,
        };
      })
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
      .map((e, i) => {
        e.rank = i + 1;
        e.isWinner = isFinal && e.rank === 1;
        e.medal = medalForRank(e.rank, isFinal);
        return e;
      });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching live results:", error);
    return NextResponse.json({ error: "Failed to fetch live results" }, { status: 500 });
  }
}
