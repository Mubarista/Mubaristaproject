"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Star, Trophy, Users, CheckCircle2, Clock } from "lucide-react";

type QueueItem = {
  applicationId: string;
  name: string;
  videoUrl: string;
  scoredCount: number;
  totalJudges: number;
  completed: boolean;
  averageScore: number;
  finalScore: string;
  rank: number;
};

interface LiveScoringLeaderboardProps {
  competitionId: string;
  title?: string;
}

export function LiveScoringLeaderboard({ competitionId, title = "Live Judging Leaderboard" }: LiveScoringLeaderboardProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchQueue() {
    try {
      const res = await fetch(`/api/competitions/scoring-queue?competitionId=${competitionId}`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.leaderboard || []);
        setCurrent(data.current || null);
        setIsComplete(data.isComplete || false);
      }
    } catch (error) {
      console.error("Error fetching scoring queue:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
    intervalRef.current = setInterval(fetchQueue, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [competitionId]);

  if (loading) {
    return (
      <div className="w-full rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-sm text-muted">Loading live leaderboard…</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="w-full rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-sm text-muted">No participants to display.</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4" style={{ color: "#c9a227" }} /> {title}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {isComplete ? "Judging complete. Final scores are locked." : "Participants are judged in order. The current one moves to the back after scoring."}
          </p>
        </div>
        {!isComplete && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md text-white" style={{ background: "rgba(220,38,38,0.9)" }}>
            LIVE
          </span>
        )}
      </div>

      <div className="space-y-2 min-h-[160px]">
        <AnimatePresence mode="popLayout">
          {queue.map((item, index) => {
            const isCurrent = !isComplete && item.applicationId === current?.applicationId;
            const isWinner = isComplete && index === 0;
            const isCompleted = item.completed;

            return (
              <motion.div
                key={item.applicationId}
                layout
                initial={{ opacity: 0, x: -60, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: isWinner
                    ? "linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.08))"
                    : isCurrent
                      ? "rgba(220,38,38,0.12)"
                      : isCompleted
                        ? "rgba(22,163,74,0.08)"
                        : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isWinner ? "rgba(201,162,39,0.4)" : isCurrent ? "rgba(220,38,38,0.3)" : isCompleted ? "rgba(22,163,74,0.25)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    background: isWinner ? "linear-gradient(135deg, #c9a227, #f5c842)" : isCurrent ? "rgba(220,38,38,0.9)" : isCompleted ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.05)",
                    color: isWinner ? "#000" : isCurrent ? "#fff" : isCompleted ? "#4ade80" : "#6b7280",
                  }}>
                  {isWinner ? <Trophy className="h-4 w-4" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] flex items-center gap-1" style={{ color: isCompleted ? "#4ade80" : "#9ca3af" }}>
                      {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : isCurrent ? <Play className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {isCompleted ? "Scored" : isCurrent ? "Judging now" : "Waiting"}
                    </span>
                    {!isCompleted && !isCurrent && (
                      <span className="text-[10px]" style={{ color: "#6b7280" }}>
                        <Users className="h-3 w-3 inline mr-0.5" />
                        {item.scoredCount}/{item.totalJudges} judges
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px]" style={{ color: "#f59e0b" }}>
                        <Users className="h-3 w-3 inline mr-0.5" />
                        {item.scoredCount}/{item.totalJudges} scored
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {isCompleted || isWinner ? (
                    <p className="text-sm font-bold" style={{ color: isWinner ? "#f5c842" : "#e5e7eb" }}>
                      <Star className="h-3 w-3 inline mr-1" />
                      {item.finalScore}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">—</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {isComplete && queue[0] && (
        <div className="mt-4 p-3 rounded-xl text-center" style={{ background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.25)" }}>
          <p className="text-sm font-bold text-white">
            <Trophy className="h-4 w-4 inline mr-1" style={{ color: "#f5c842" }} />
            Winner: {queue[0].name} — {queue[0].finalScore}/10
          </p>
        </div>
      )}
    </div>
  );
}
