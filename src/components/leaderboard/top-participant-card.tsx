"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users } from "lucide-react";

type Participant = {
  id: string;
  fullName: string;
  country: string;
  totalScore: number;
  rank: number;
  scoredCount?: number;
  totalJudges?: number;
};

interface TopParticipantCardProps {
  competitionId: string;
  title?: string;
}

export function TopParticipantCard({ competitionId, title = "Top Participant" }: TopParticipantCardProps) {
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(
          `/api/competitions/${competitionId}/leaderboard`
        );
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, [competitionId]);

  if (isLoading) {
    return (
      <div className="rounded-2xl p-6 glass-card text-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  const top = leaderboard[0];
  if (!top) {
    return (
      <div className="rounded-2xl p-6 glass-card text-center">
        <p className="text-muted">No participants yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 glass-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
      <AnimatePresence mode="popLayout">
        {leaderboard.map((item, index) => {
          const isTop = index === 0;
          return (
            <motion.div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                transition: isTop ? "transform 0.3s ease, opacity 0.3s ease" : "",
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                style={{
                  background:
                    isTop
                      ? "linear-gradient(135deg, #f5c842, #eab308)"
                      : "rgba(255,255,255,0.05)",
                  color: isTop ? "#000" : "#6b7280",
                }}
              >
                {isTop ? (
                  <Trophy className="h-4 w-4" />
                ) : index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.fullName}
                </p>
                <p className="text-xs text-muted">{item.country}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow">
                  {item.rank}
                </p>
                <p className="text-sm text-muted">Score: {item.totalScore}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {top && (
        <div className="mt-4 p-3 rounded-xl text-center">
          <p className="text-sm font-bold text-white">
            <Trophy className="h-4 w-4 inline mr-1" style={{ color: "#f5c842" }} />
            {top.fullName}: {top.totalScore}
          </p>
        </div>
      )}
    </div>
  );
}