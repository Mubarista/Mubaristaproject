import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function parseCriteria(criteria: unknown): { key: string; label: string; weight: number; desc: string }[] {
  const items = Array.isArray(criteria) ? criteria : [];
  const weight = items.length > 0 ? Math.round(100 / items.length) : 0;
  const remainder = items.length > 0 ? 100 - weight * (items.length - 1) : 0;

  return items.map((item: unknown, i: number) => {
    if (typeof item === "string") {
      return {
        key: slugify(item),
        label: item,
        weight: i === items.length - 1 ? remainder : weight,
        desc: item,
      };
    }
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      const label = String(obj.label || obj.name || obj.value || "Criterion");
      return {
        key: String(obj.key || slugify(label)),
        label,
        weight: Number(obj.weight || (i === items.length - 1 ? remainder : weight)),
        desc: String(obj.description || obj.desc || label),
      };
    }
    return { key: `criterion_${i}`, label: "Criterion", weight: i === items.length - 1 ? remainder : weight, desc: "Criterion" };
  });
}

function isScored(scoreRow: unknown): boolean {
  if (!scoreRow || typeof scoreRow !== "object") return false;
  const row = scoreRow as Record<string, unknown>;
  return row.score !== null && row.score !== undefined && row.score !== "";
}

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

    // Get all active judges for this competition to determine required score count and turn order
    const competitionTitle = competition ? String(competition.title || "").replace(/'/g, "''") : "";
    const judgeQuery = competitionTitle
      ? supabaseAdmin.from("judge_credentials").select("id, name, active, created_at").or(`assigned_competition.eq.${competitionId},assigned_competition.ilike.${competitionTitle}`).order("created_at", { ascending: true })
      : supabaseAdmin.from("judge_credentials").select("id, name, active, created_at").eq("assigned_competition", competitionId).order("created_at", { ascending: true });
    const { data: allJudges, error: judgesError } = await judgeQuery;

    if (judgesError) throw judgesError;

    const activeJudges = (allJudges || []).filter((j: any) => j.active !== false);
    const totalJudges = Math.max(activeJudges.length, 1);

    const { data: applications, error: appsError } = await supabaseAdmin
      .from("competition_applications")
      .select("*")
      .eq("competition_id", competitionId)
      .neq("status", "declined")
      .order("scoring_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (appsError) throw appsError;

    const apps = (mapKeysToCamelCase(applications || []) as unknown[]) as Record<string, unknown>[];

    // Get all scores for this competition
    const { data: allScores, error: scoresError } = await supabaseAdmin
      .from("judge_scores")
      .select("*")
      .eq("competition_id", competitionId);
    if (scoresError) throw scoresError;

    // Build a map of application_id -> list of judge ids who scored
    const scoresByApp = new Map<string, { judgeId: string; score: number | null; feedback: string; criteriaScores: Record<string, number> }[]>();
    (allScores || []).forEach((s: unknown) => {
      const row = s as Record<string, unknown>;
      const appId = String(row.application_id);
      if (!scoresByApp.has(appId)) {
        scoresByApp.set(appId, []);
      }
      if (isScored(row)) {
        scoresByApp.get(appId)?.push({
          judgeId: String(row.judge_id),
          score: Number(row.score),
          feedback: String(row.feedback || ""),
          criteriaScores: (row.criteria_scores as Record<string, number>) || {},
        });
      }
    });

    // Find current active application (first one not yet fully scored)
    let currentApp: Record<string, unknown> | null = null;
    let currentIndex = 0;
    const completedApplicationIds: string[] = [];

    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      const appId = String(app.id);
      const scored = scoresByApp.get(appId) || [];
      if (scored.length >= totalJudges) {
        completedApplicationIds.push(appId);
      } else {
        currentApp = app;
        currentIndex = i;
        break;
      }
    }

    // If all applications scored, show the last one as completed
    if (!currentApp && apps.length > 0) {
      currentApp = apps[apps.length - 1];
      currentIndex = apps.length - 1;
    }

    const currentAppId = currentApp ? String(currentApp.id) : null;
    const currentScores = currentAppId ? (scoresByApp.get(currentAppId) || []) : [];
    const myScore = currentScores.find(s => s.judgeId === judgeId);
    const iScoredCurrent = !!myScore;
    const currentCompletedCount = currentScores.length;
    const currentAllDone = currentScores.length >= totalJudges;

    // Turn-based: determine which judge is up next for the current participant
    // Order judges by created_at; the first one who has not scored is the active turn
    const judgeOrder = activeJudges.map((j: any) => ({
      id: j.id,
      name: j.name,
    }));

    const scoredJudgeIds = new Set(currentScores.map(s => s.judgeId));
    const currentTurnJudge = judgeOrder.find(j => !scoredJudgeIds.has(j.id)) || null;
    const isYourTurn = !!currentTurnJudge && currentTurnJudge.id === judgeId;
    const waitingForJudge = currentTurnJudge && currentTurnJudge.id !== judgeId ? currentTurnJudge.name : null;

    const judgeStatuses = judgeOrder.map((j) => {
      const scored = currentScores.find((s: any) => s.judgeId === j.id);
      const isCurrentTurn = currentTurnJudge?.id === j.id && !scored;
      return {
        id: j.id,
        name: j.name,
        done: !!scored,
        isCurrentTurn,
      };
    });

    const submissions = currentApp
      ? [
          {
            id: currentAppId,
            applicationId: currentAppId,
            name: String(currentApp.fullName || currentApp.userName || "Participant"),
            country: String(currentApp.country || "Unknown"),
            flag: "",
            category: String(competition?.difficulty || ""),
            duration: "",
            videoUrl: String(currentApp.videoUrl || currentApp.video_url || ""),
            status: iScoredCurrent ? ("scored" as const) : ("pending" as const),
            score: myScore ? myScore.score : null,
            criteriaScores: myScore ? myScore.criteriaScores : {},
            feedback: myScore ? myScore.feedback : "",
          },
        ]
      : [];

    const scoredCount = completedApplicationIds.length + (currentAllDone ? 1 : 0) - (iScoredCurrent ? 0 : 0);
    const totalEntries = apps.length;
    const pendingCount = totalEntries - (iScoredCurrent ? completedApplicationIds.length + (currentAllDone ? 1 : 0) : completedApplicationIds.length);

    const avgScore = totalEntries > 0
      ? (apps
          .map(app => {
            const appScores = scoresByApp.get(String(app.id)) || [];
            const total = appScores.reduce((sum, s) => sum + (s.score || 0), 0);
            return appScores.length > 0 ? total / appScores.length : 0;
          })
          .reduce((sum, s) => sum + s, 0) / totalEntries)
          .toFixed(1)
      : "0.0";

    const activity = (allScores || [])
      .filter((s: unknown) => (s as Record<string, unknown>).judge_id === judgeId)
      .sort((a: unknown, b: unknown) => {
        const aTime = new Date(String((a as Record<string, unknown>).updated_at || (a as Record<string, unknown>).created_at)).getTime();
        const bTime = new Date(String((b as Record<string, unknown>).updated_at || (b as Record<string, unknown>).created_at)).getTime();
        return bTime - aTime;
      })
      .slice(0, 10)
      .map((s: unknown) => {
        const row = s as Record<string, unknown>;
        const time = new Date(String(row.updated_at || row.created_at)).toLocaleString();
        return {
          msg: `Scored ${String(row.participant_name || "Participant")} — ${Number(row.score).toFixed(1)}/10`,
          time,
        };
      });

    const response = {
      competition: competition
        ? {
            id: String(competition.id),
            title: String(competition.title),
            round: String(competition.status || "N/A"),
            deadline: String(competition.registrationDeadline || "TBD"),
            totalEntries,
            scored: scoredCount,
            pending: pendingCount,
            difficulty: String(competition.difficulty || ""),
            rules: Array.isArray(competition.rules) ? competition.rules : [],
            criteria: parseCriteria(competition.judgingCriteria),
          }
        : {
            title: "No Active Competition",
            round: "N/A",
            deadline: "TBD",
            totalEntries: 0,
            scored: 0,
            pending: 0,
            rules: [],
            criteria: [],
          },
      submissions,
      progress: {
        currentIndex: currentIndex + 1,
        totalEntries,
        completedApplicationIds,
        judgeStatuses,
        currentCompletedCount,
        totalJudges,
        currentAllDone,
        isYourTurn,
        waitingForJudge,
        turnBased: true,
      },
      avgScore,
      activity,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching judge portal data:", error);
    return NextResponse.json({ error: "Failed to fetch judge portal data" }, { status: 500 });
  }
}