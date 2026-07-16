"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Search } from "lucide-react";
import { useJudgeAuth } from "@/lib/judge-auth-context";
import { useLiveScores } from "@/lib/use-live-scores";

type EntryStatus = "qualified" | "borderline" | "pending" | "eliminated";

const STATUS_STYLE: Record<EntryStatus, { label: string; color: string; bg: string; border: string }> = {
  qualified:  { label: "Qualified",  color: "#4ade80", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.25)"  },
  borderline: { label: "Borderline", color: "#eab308", bg: "rgba(234,179,8,0.1)",   border: "rgba(234,179,8,0.25)"  },
  pending:    { label: "Pending",    color: "#c9a227", bg: "rgba(201,162,39,0.1)",  border: "rgba(201,162,39,0.25)" },
  eliminated: { label: "Eliminated", color: "#ef4444", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.25)"  },
};

function Trend({ curr, prev }: { curr: number; prev: number }) {
  const diff = prev - curr;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-xs" style={{ color: "#4ade80" }}><TrendingUp className="h-3 w-3" />+{diff}</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-xs" style={{ color: "#ef4444" }}><TrendingDown className="h-3 w-3" />{diff}</span>;
  return <span className="flex items-center gap-0.5 text-xs" style={{ color: "#4b5563" }}><Minus className="h-3 w-3" /></span>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-black text-sm shrink-0" style={{ background: "linear-gradient(135deg, #f5c842, #c9a227)" }}><Trophy className="h-4 w-4" /></div>;
  if (rank === 2) return <div className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0" style={{ background: "rgba(148,163,184,0.2)", color: "#94a3b8" }}><Medal className="h-4 w-4" /></div>;
  if (rank === 3) return <div className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0" style={{ background: "rgba(180,83,9,0.2)", color: "#b45309" }}><Medal className="h-4 w-4" /></div>;
  return <div className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0" style={{ background: "rgba(255,255,255,0.04)", color: "#6b7280" }}>{rank}</div>;
}

type Entry = {
  id: string;
  name: string;
  country: string;
  flag?: string;
  rank: number;
  prev?: number;
  score?: number;
  status?: EntryStatus;
  creativity?: number;
  symmetry?: number;
  precision?: number;
  milkTexture?: number;
  technique?: number;
  presentation?: number;
};

export default function LeaderboardPage() {
  const { judgeId } = useJudgeAuth();
  const [filter, setFilter] = useState<"all" | "qualified" | "pending" | "eliminated">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ qualified: 0, borderline: 0, pending: 0, total: 0 });
  const [competitionId, setCompetitionId] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!judgeId) return;
    try {
      const res = await fetch(`/api/judge/leaderboard?judgeId=${judgeId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEntries(data);
          setStats({ qualified: 0, borderline: 0, pending: 0, total: 0 });
        } else {
          setEntries(data.entries || []);
          setStats(data.stats || { qualified: 0, borderline: 0, pending: 0, total: 0 });
          if (data.competitionId) setCompetitionId(data.competitionId);
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [judgeId]);

  useEffect(() => {
    if (!judgeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaderboard();
  }, [judgeId, fetchLeaderboard]);

  useLiveScores(competitionId, () => {
    fetchLeaderboard();
  });

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  const visible = entries.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (search && !e.name?.toLowerCase().includes(search.toLowerCase()) && !e.country?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const { qualified, borderline, pending } = stats;

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(201,162,39,0.15)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.3)" }}>
            LIVE STANDINGS
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Leaderboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>World Latte Art Championship 2026 · Round 2</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Qualified", count: qualified,  color: "#4ade80" },
          { label: "Borderline", count: borderline, color: "#eab308" },
          { label: "Pending",   count: pending,    color: "#c9a227" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[180px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Search className="h-4 w-4 shrink-0" style={{ color: "#6b7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or country…"
            className="flex-1 bg-transparent text-sm text-white focus:outline-none"
            style={{ color: "white" }} />
        </div>
        <div className="flex gap-1">
          {(["all", "qualified", "pending", "eliminated"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all"
              style={filter === f
                ? { background: "rgba(201,162,39,0.2)", color: "#f5c842", border: "1px solid rgba(201,162,39,0.3)" }
                : { color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: "#4b5563" }}>Rank</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#4b5563" }}>Participant</th>
                <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: "#4b5563" }}>Score</th>
                <th className="text-right px-4 py-3 text-xs font-medium hidden lg:table-cell" style={{ color: "#4b5563" }}>Creativity</th>
                <th className="text-right px-4 py-3 text-xs font-medium hidden lg:table-cell" style={{ color: "#4b5563" }}>Precision</th>
                <th className="text-right px-4 py-3 text-xs font-medium hidden lg:table-cell" style={{ color: "#4b5563" }}>Technique</th>
                <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#4b5563" }}>Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#4b5563" }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e, i: number) => {
                const st = STATUS_STYLE[e.status || "pending"] || STATUS_STYLE.pending;
                const isExp = expanded === e.name;
                return (
                  <React.Fragment key={e.id}>
                    <motion.tr
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      onClick={() => setExpanded(isExp ? null : e.name)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-5 py-3.5">
                        <RankBadge rank={e.rank} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold text-black shrink-0"
                            style={{ background: "linear-gradient(135deg, #c9a227, #f5c84255)" }}>
                            {e.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{e.name}</p>
                            <p className="text-xs" style={{ color: "#6b7280" }}>{e.flag} {e.country}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-base" style={{ color: e.score ? "#f5c842" : "#4b5563" }}>
                        {e.score ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs hidden lg:table-cell" style={{ color: "#9ca3af" }}>{e.creativity ?? "—"}</td>
                      <td className="px-4 py-3.5 text-right text-xs hidden lg:table-cell" style={{ color: "#9ca3af" }}>{e.precision ?? "—"}</td>
                      <td className="px-4 py-3.5 text-right text-xs hidden lg:table-cell" style={{ color: "#9ca3af" }}>{e.technique ?? "—"}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Trend curr={e.rank} prev={e.prev ?? e.rank} />
                      </td>
                    </motion.tr>
                    {isExp && (
                      <tr style={{ background: "rgba(201,162,39,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td colSpan={8} className="px-5 py-4">
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-xs">
                            {[
                              { label: "Creativity", val: e.creativity },
                              { label: "Symmetry", val: e.symmetry },
                              { label: "Precision", val: e.precision },
                              { label: "Milk Texture", val: e.milkTexture },
                              { label: "Technique", val: e.technique },
                              { label: "Presentation", val: e.presentation },
                            ].map(sc => (
                              <div key={sc.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                                <p style={{ color: "#4b5563" }}>{sc.label}</p>
                                <p className="text-base font-bold mt-1" style={{ color: sc.val ? "#f5c842" : "#374151" }}>{sc.val ?? "—"}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
