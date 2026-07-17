import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId");

    if (!competitionId) {
      return NextResponse.json({ error: "Missing competitionId" }, { status: 400 });
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
          participantName: String(app.fullName || app.userName || app.user_name || "Participant"),
          userName: String(app.userName || app.user_name || ""),
          country: String(app.country || "Unknown"),
          flag: "",
          score: avgScore !== undefined ? Math.round(avgScore * 10) / 10 : undefined,
          rank: 0,
          status,
          isWinner: false,
          feedback: appScores.length > 0 ? (appScores[0].feedback as string) || "" : "",
        };
      })
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
      .map((e, i) => {
        e.rank = i + 1;
        e.isWinner = e.rank === 1;
        return e;
      });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching live results:", error);
    return NextResponse.json({ error: "Failed to fetch live results" }, { status: 500 });
  }
}
