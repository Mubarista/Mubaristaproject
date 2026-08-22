"use client";

import { useEffect, useRef } from "react";
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
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!competitionId) {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      return;
    }

    let isActive = true;
    const maxRetries = 3;
    let retryCount = 0;

    function setupChannel() {
      if (!isActive) return;

      const channelName = `live-scores-${competitionId}-${Date.now()}`;
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
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            if (retryCount < maxRetries) {
              retryCount++;
              console.warn(`Live scores channel ${status} (retry ${retryCount}/${maxRetries})`);
              retryTimeoutRef.current = setTimeout(() => {
                channel.unsubscribe();
                supabase.removeChannel(channel);
                setupChannel();
              }, 2000 * retryCount);
            } else {
              console.warn("Live scores channel failed after maximum retries. Falling back to manual refresh.");
            }
          }
        });

      channelRef.current = channel;
    }

    setupChannel();

    return () => {
      isActive = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [competitionId]);
}
