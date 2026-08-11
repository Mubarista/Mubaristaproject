import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CompetitionStatus } from "@/types";

interface TimelineEvent {
  date?: string;
  event?: string;
  phase?: CompetitionStatus;
}

const VALID_PHASES: CompetitionStatus[] = [
  "upcoming",
  "registration_open",
  "in_progress",
  "voting",
  "judging",
  "winner_announcement",
  "ended",
];

function padTwo(n: string) {
  return n.length === 1 ? `0${n}` : n;
}

function isoFromParts(y: string, m: string, d: string) {
  return `${y}-${padTwo(m)}-${padTwo(d)}T00:00:00.000Z`;
}

function isValidDate(d: Date) {
  return d instanceof Date && !isNaN(d.getTime());
}

export function parseEventDate(date?: string, event?: string): Date | null {
  if (typeof date === "string" && date.length > 0) {
    const direct = new Date(date);
    if (isValidDate(direct)) return direct;

    // Try 11.08.2026 or 11/08/2026
    const dotted = date.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dotted) return new Date(isoFromParts(dotted[3], dotted[2], dotted[1]));

    const slashed = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashed) return new Date(isoFromParts(slashed[3], slashed[1], slashed[2]));
  }

  // Try to extract a date from the event caption
  const text = event || "";
  if (!text) return null;

  // ISO: 2026-08-11
  const isoMatch = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) return new Date(isoFromParts(isoMatch[1], isoMatch[2], isoMatch[3]));

  // Dot format: 11.08.2026
  const dotMatch = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (dotMatch) return new Date(isoFromParts(dotMatch[3], dotMatch[2], dotMatch[1]));

  // Slash format: 08/11/2026
  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashMatch) return new Date(isoFromParts(slashMatch[3], slashMatch[1], slashMatch[2]));

  return null;
}

function inferPhaseFromEvent(event = ""): CompetitionStatus | undefined {
  const text = event.toLowerCase();

  if (/\b(end|closed|close)\b/.test(text)) return "ended";
  if (/\b(winner|announce|announced|results?)\b/.test(text)) return "winner_announcement";
  if (/\b(judging|judge)\b/.test(text)) return "judging";
  if (/\b(voting|vote|poll)\b/.test(text)) return "voting";
  if (/\b(in progress|submissions? open|upload|video)\b/.test(text)) return "in_progress";
  if (/\b(registration.*open|open.*registration|register.*start|applications?.*open|start.*registration)\b/.test(text)) return "registration_open";

  return undefined;
}

export function computeStatusFromTimeline(
  timeline: TimelineEvent[] | null | undefined,
  now = new Date()
): CompetitionStatus {
  if (!Array.isArray(timeline) || timeline.length === 0) return "upcoming";

  const nowTime = now.getTime();

  const sorted = timeline
    .filter((t) => t)
    .map((t) => {
      const parsed = parseEventDate(t.date, t.event);
      const phase = t.phase && VALID_PHASES.includes(t.phase)
        ? t.phase
        : inferPhaseFromEvent(t.event);
      return { ...t, phase, dateTime: parsed ? parsed.getTime() : NaN };
    })
    .filter((t) => !isNaN(t.dateTime))
    .sort((a, b) => a.dateTime - b.dateTime);

  // The active phase is the latest timeline event whose date has started.
  let active: CompetitionStatus | undefined;
  for (const item of sorted) {
    if (item.dateTime <= nowTime && item.phase && VALID_PHASES.includes(item.phase)) {
      active = item.phase;
    }
  }

  return active || "upcoming";
}

export async function syncCompetitionStatuses() {
  const { data: competitions, error } = await supabaseAdmin
    .from("competitions")
    .select("id, event_timeline, status");

  if (error) {
    console.error("Error fetching competitions for status sync:", error);
    return;
  }

  const now = new Date();
  for (const c of competitions || []) {
    const timeline = (c.event_timeline as TimelineEvent[] | null) || [];
    const computed = computeStatusFromTimeline(timeline, now);

    if (computed !== c.status) {
      const { error: updateError } = await supabaseAdmin
        .from("competitions")
        .update({ status: computed, updated_at: now.toISOString() })
        .eq("id", c.id);

      if (updateError) {
        console.error(`Error updating competition ${c.id} status:`, updateError);
      }
    }
  }
}
