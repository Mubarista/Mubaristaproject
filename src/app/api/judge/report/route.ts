import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function parseCriteria(criteria: unknown): { key: string; label: string }[] {
  const items = Array.isArray(criteria) ? criteria : [];
  return items.map((item: unknown) => {
    if (typeof item === "string") {
      return { key: slugify(item), label: item };
    }
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      const label = String(obj.label || obj.name || obj.value || "Criterion");
      return { key: String(obj.key || slugify(label)), label };
    }
    return { key: "criterion", label: "Criterion" };
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
      return NextResponse.json({ summary: null, criteriaAverages: [], countries: [] });
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
      .eq("judge_id", judgeId)
      .eq("competition_id", competitionId);
    if (scoresError) throw scoresError;

    const apps = (mapKeysToCamelCase(applications || []) as unknown[]) as Record<string, unknown>[];
    const rawScores = (scores || []) as Record<string, unknown>[];

    const appsById = new Map<string, Record<string, unknown>>();
    apps.forEach((app) => appsById.set(String(app.id), app));

    const scoredEntries = rawScores
      .map((s) => {
        const app = appsById.get(String(s.application_id));
        return {
          applicationId: String(s.application_id),
          name: String(s.participant_name || app?.fullName || app?.userName || "Participant"),
          country: String(app?.country || "Unknown"),
          flag: "",
          score: Number(s.score || 0),
          criteriaScores: (s.criteria_scores as Record<string, number>) || {},
        };
      })
      .sort((a, b) => b.score - a.score);

    const totalEntries = apps.length;
    const scoredCount = scoredEntries.length;
    const avgScore = scoredCount > 0
      ? (scoredEntries.reduce((sum, e) => sum + e.score, 0) / scoredCount).toFixed(1)
      : "0.0";
    const qualified = scoredEntries.filter((e) => e.score >= 8).length;

    const highest = scoredEntries.length > 0 ? scoredEntries[0] : null;
    const lowest = scoredEntries.length > 0 ? scoredEntries[scoredEntries.length - 1] : null;

    const criteria = parseCriteria(competition?.judgingCriteria);
    const criteriaTotals: Record<string, { label: string; total: number; count: number }> = {};
    criteria.forEach((c) => {
      criteriaTotals[c.key] = { label: c.label, total: 0, count: 0 };
    });

    scoredEntries.forEach((e) => {
      criteria.forEach((c) => {
        const val = e.criteriaScores[c.key];
        if (typeof val === "number") {
          criteriaTotals[c.key].total += val;
          criteriaTotals[c.key].count += 1;
        }
      });
    });

    const criteriaAverages = Object.values(criteriaTotals)
      .map((c) => ({
        label: c.label,
        avg: c.count > 0 ? Math.round((c.total / c.count) * 10) / 10 : 0,
      }))
      .filter((c) => c.avg > 0);

    const countryMap = new Map<string, { name: string; flag: string; entries: number; total: number }>();
    scoredEntries.forEach((e) => {
      const existing = countryMap.get(e.country);
      if (existing) {
        existing.entries += 1;
        existing.total += e.score;
      } else {
        countryMap.set(e.country, { name: e.country, flag: e.flag, entries: 1, total: e.score });
      }
    });

    const countries = Array.from(countryMap.values())
      .map((c) => ({
        name: c.name,
        flag: c.flag,
        entries: c.entries,
        avgScore: c.entries > 0 ? Math.round((c.total / c.entries) * 10) / 10 : 0,
      }))
      .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));

    const summary = {
      competitionId,
      totalEntries,
      scored: scoredCount,
      avgScore,
      qualified,
      highest: highest
        ? { name: highest.name, country: highest.country, flag: highest.flag, score: highest.score }
        : { name: "—", country: "", flag: "", score: 0 },
      lowest: lowest
        ? { name: lowest.name, country: lowest.country, flag: lowest.flag, score: lowest.score }
        : { name: "—", country: "", flag: "", score: 0 },
    };

    return NextResponse.json({ summary, criteriaAverages, countries });
  } catch (error) {
    console.error("Error fetching report data:", error);
    return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      judgeId,
      competitionId,
      summary,
      criteriaAverages,
      countries,
      notes,
      status = "generated",
    } = body;

    if (!judgeId) {
      return NextResponse.json({ error: "Missing judgeId" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("judge_reports")
      .upsert(
        {
          judge_id: judgeId,
          competition_id: competitionId || null,
          summary: summary || null,
          criteria_averages: criteriaAverages || null,
          countries: countries || null,
          notes: notes || null,
          status: status || "generated",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "judge_id" }
      );

    if (error) {
      console.error("Error saving judge report:", error);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving judge report:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ message: "Not implemented" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Not implemented" }, { status: 405 });
}
