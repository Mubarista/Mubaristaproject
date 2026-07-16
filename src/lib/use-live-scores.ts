"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

export type ScoreChange = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  judgeId: string | null;
  applicationId: string | null;
  competitionId: string | null;
  score: number | null;
};

export function useLiveScores(
  competitionId: string | null | undefined,
  onChange: (change: ScoreChange) => void
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!competitionId) return;

    const channelName = `live-scores-${competitionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "judge_scores",
          filter: `competition_id=eq.${competitionId}`,
        },
        (payload) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          const newRecord = payload.new as Record<string, unknown> | undefined;
          const oldRecord = payload.old as Record<string, unknown> | undefined;

          const record = newRecord || oldRecord || {};

          onChangeRef.current({
            eventType,
            judgeId: record.judge_id ? String(record.judge_id) : null,
            applicationId: record.application_id ? String(record.application_id) : null,
            competitionId: record.competition_id ? String(record.competition_id) : null,
            score: typeof record.score === "number" ? record.score : null,
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Live scores channel error:", status);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [competitionId]);
}
