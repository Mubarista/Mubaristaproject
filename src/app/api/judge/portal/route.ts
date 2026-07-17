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

    const { data: applications, error: appsError } = await supabaseAdmin
      .from("competition_applications")
      .select("*")
      .eq("competition_id", competitionId)
      .neq("status", "declined")
      .order("created_at", { ascending: false });
    if (appsError) throw appsError;

    const apps = (mapKeysToCamelCase(applications || []) as unknown[]) as Record<string, unknown>[];

    const { data: scores, error: scoresError } = await supabaseAdmin
      .from("judge_scores")
      .select("*")
      .eq("judge_id", judgeId);
    if (scoresError) throw scoresError;

    const scoresMap = new Map((scores || []).map((s: unknown) => {
      const row = s as Record<string, unknown>;
      return [String(row.application_id), row];
    }));

    const submissions = apps.map((app) => {
      const appId = String(app.id);
      const scoreRow = scoresMap.get(appId);
      const status = scoreRow ? "scored" : "pending";
      return {
        id: appId,
        applicationId: appId,
        name: String(app.fullName || app.userName || app.userName || "Participant"),
        country: String(app.country || "Unknown"),
        flag: "",
        category: String(competition?.difficulty || ""),
        duration: "",
        videoUrl: String(app.videoUrl || app.video_url || ""),
        status,
        score: status === "scored" ? Number(scoreRow?.score) : null,
        criteriaScores: (scoreRow?.criteria_scores as Record<string, number>) || {},
        feedback: String(scoreRow?.feedback || ""),
      };
    });

    const scoredCount = submissions.filter((s) => s.status === "scored").length;
    const totalEntries = submissions.length;
    const pendingCount = totalEntries - scoredCount;
    const avgScore = scoredCount > 0
      ? (submissions
          .filter((s) => s.score !== null)
          .reduce((acc, s) => acc + (s.score || 0), 0) / scoredCount)
          .toFixed(1)
      : "0.0";

    const activity = (scores || [])
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
      avgScore,
      activity,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching judge portal data:", error);
    return NextResponse.json({ error: "Failed to fetch judge portal data" }, { status: 500 });
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

