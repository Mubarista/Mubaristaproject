"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Star, Clock, CheckCircle2, AlertCircle, TrendingUp,
  Users, Play, ChevronRight, Award,
} from "lucide-react";
import { useJudgeAuth } from "@/lib/judge-auth-context";
import Link from "next/link";

function G({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: React.ElementType; color: string; sub: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: "#6b7280" }}>{label}</span>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs mt-1" style={{ color: "#4b5563" }}>{sub}</p>
    </div>
  );
}

type Submission = {
  id: string;
  applicationId: string;
  name: string;
  country: string;
  flag?: string;
  category?: string;
  duration?: string;
  status: "pending" | "scored";
  score: number | null;
};

type PortalData = {
  competition: {
    title: string;
    round: string;
    deadline: string;
    totalEntries: number;
    scored: number;
    pending: number;
  };
  submissions: Submission[];
  activity: { msg: string; time: string }[];
  avgScore: string;
};

export default function JudgeDashboard() {
  const { judgeName, judgeId } = useJudgeAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);

  const fetchPortalData = useCallback(async () => {
    try {
      const res = await fetch(`/api/judge/portal?judgeId=${judgeId}`);
      if (res.ok) {
        const portalData = (await res.json()) as PortalData;
        setData(portalData);
      }
    } catch (error) {
      console.error("Error fetching judge portal data:", error);
    } finally {
      setLoading(false);
    }
  }, [judgeId]);

  useEffect(() => {
    if (judgeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPortalData();
    }
  }, [judgeId, fetchPortalData]);

  useEffect(() => {
    if (!judgeId) return;
    const interval = setInterval(() => {
      fetchPortalData();
    }, 5000);
    return () => clearInterval(interval);
  }, [judgeId, fetchPortalData]);

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  const competition = data?.competition || {
    title: "No Active Competition",
    round: "N/A",
    deadline: "TBD",
    totalEntries: 0,
    scored: 0,
    pending: 0,
  };

  const submissions = data?.submissions || [];
  const activity = data?.activity || [];
  const avgScore = data?.avgScore || "0.0";

  const pct = competition.totalEntries > 0 
    ? Math.round((competition.scored / competition.totalEntries) * 100) 
    : 0;

  const filtered = activeTab === "pending"
    ? submissions.filter((s) => s.status === "pending")
    : submissions;

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(201,162,39,0.15)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.3)" }}>
            ACTIVE COMPETITION
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-2">{competition.title}</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{competition.round} · Deadline: {competition.deadline}</p>
        <p className="text-sm mt-1" style={{ color: "#4b5563" }}>Signed in as <span style={{ color: "#c9a227" }}>{judgeName}</span></p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <G label="Total Entries" value={String(competition.totalEntries)} icon={Users} color="#2563eb" sub="This round" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <G label="Scored" value={String(competition.scored)} icon={CheckCircle2} color="#16a34a" sub={`${pct}% complete`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <G label="Pending" value={String(competition.pending)} icon={AlertCircle} color="#eab308" sub="Awaiting your score" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
          <G label="Avg Score Given" value={avgScore} icon={Star} color="#c9a227" sub="Your avg so far" />
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Judging Progress</p>
          <span className="text-sm font-bold" style={{ color: "#c9a227" }}>{competition.scored}/{competition.totalEntries}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
            style={{ background: "linear-gradient(90deg, #c9a227, #f5c842)" }} />
        </div>
        <p className="text-xs mt-2" style={{ color: "#4b5563" }}>{pct}% of entries judged · {competition.pending} remaining</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions list */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-semibold text-white">Submissions</h2>
              <div className="flex gap-1">
                {(["pending", "all"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all"
                    style={activeTab === t
                      ? { background: "rgba(201,162,39,0.2)", color: "#f5c842", border: "1px solid rgba(201,162,39,0.3)" }
                      : { color: "#6b7280", border: "1px solid transparent" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {filtered.map((sub, i: number) => (
                <motion.div key={sub.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 px-5 py-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-black shrink-0"
                    style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)" }}>
                    {sub.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{sub.name}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{sub.flag} {sub.country} · {sub.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sub.score !== null ? (
                      <span className="text-sm font-bold px-2.5 py-1 rounded-xl" style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.3)" }}>
                        {sub.score}/10
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-xl" style={{ background: "rgba(234,179,8,0.12)", color: "#eab308", border: "1px solid rgba(234,179,8,0.25)" }}>
                        Pending
                      </span>
                    )}
                    <Link href="/judge/score">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{ background: sub.score === null ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.04)", color: sub.score === null ? "#f5c842" : "#6b7280", border: `1px solid ${sub.score === null ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                        {sub.score === null ? <><Star className="h-3.5 w-3.5" /> Score</> : <><Play className="h-3.5 w-3.5" /> Review</>}
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="px-5 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Link href="/judge/score" className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: "#c9a227" }}>
                Open scoring panel <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Activity */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="font-semibold text-white text-sm mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activity.map((a, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#c9a227" }} />
                  <div>
                    <p className="text-xs text-white">{a.msg}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="font-semibold text-white text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { href: "/judge/score",       icon: Star,         label: "Score Next Entry",   gold: true  },
                { href: "/judge/leaderboard", icon: TrendingUp,   label: "View Leaderboard",   gold: false },
                { href: "/judge/reports",     icon: Award,        label: "Generate Report",    gold: false },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={item.gold
                      ? { background: "linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.1))", color: "#f5c842", border: "1px solid rgba(201,162,39,0.3)" }
                      : { background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Deadline reminder */}
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <Clock className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
            <div>
              <p className="text-xs font-semibold text-white">Scoring Deadline</p>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>July 5, 2026 · 18:00 UTC</p>
              <p className="text-xs mt-1 font-medium" style={{ color: "#ef4444" }}>4 days 12 hrs remaining</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
