import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CompetitionStatus } from "@/types";

interface TimelineEvent {
  date: string;
  event: string;
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

export function computeStatusFromTimeline(
  timeline: TimelineEvent[] | null | undefined,
  now = new Date()
): CompetitionStatus {
  if (!Array.isArray(timeline) || timeline.length === 0) return "upcoming";

  const nowTime = now.getTime();

  const sorted = timeline
    .filter((t) => t && typeof t.date === "string" && t.date.length > 0)
    .map((t) => ({
      ...t,
      dateTime: new Date(t.date).getTime(),
    }))
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
