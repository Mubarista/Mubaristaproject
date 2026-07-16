"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Download, CheckCircle2, BarChart3,
  Users, Star, FileText, Send, Printer,
} from "lucide-react";
import { useJudgeAuth } from "@/lib/judge-auth-context";

type ReportSummary = {
  competitionId?: string;
  totalEntries: number;
  scored: number;
  avgScore: string;
  qualified: number;
  highest: { name: string; country: string; flag: string; score: number };
  lowest: { name: string; country: string; flag: string; score: number };
};

type CriteriaItem = { label: string; avg: number };

type CountryItem = { name: string; flag: string; entries: number; avgScore: number };

export default function ReportsPage() {
  const { judgeName, judgeId } = useJudgeAuth();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [criteriaAverages, setCriteriaAverages] = useState<CriteriaItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);

  const fetchReportData = useCallback(async () => {
    if (!judgeId) return;
    try {
      const res = await fetch(`/api/judge/report?judgeId=${judgeId}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || null);
        setCriteriaAverages(data.criteriaAverages || []);
        setCountries(data.countries || []);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  }, [judgeId]);

  useEffect(() => {
    if (!judgeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReportData();
  }, [judgeId, fetchReportData]);

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  async function generate() {
    if (!summary || !judgeId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/judge/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeId,
          competitionId: summary.competitionId,
          summary,
          criteriaAverages,
          countries,
          notes,
          status: "generated",
        }),
      });
      if (res.ok) setGenerated(true);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadPDF() {
    window.print();
  }

  function handlePrint() {
    window.print();
  }

  async function handleSubmit() {
    if (!summary || !judgeId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/judge/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeId,
          competitionId: summary.competitionId,
          summary,
          criteriaAverages,
          countries,
          notes,
          status: "submitted",
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (!summary) {
    return (
      <div className="p-8 min-h-screen">
        <div className="mb-6">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(201,162,39,0.15)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.3)" }}>
            REPORTS
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">Judge Report</h1>
        </div>
        <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white">No report data available. Start scoring submissions to generate a report.</p>
          <a href="/judge/score" className="inline-block mt-4 text-sm" style={{ color: "#c9a227" }}>Go to Scoring Panel</a>
        </div>
      </div>
    );
  }

  const maxAvg = (criteriaAverages?.length ?? 0) > 0 ? Math.max(...criteriaAverages.map(c => c.avg)) : 10;

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(201,162,39,0.15)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.3)" }}>
            REPORTS
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Judge Report</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>World Latte Art Championship 2026 · {judgeName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — main report content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Summary KPIs */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" style={{ color: "#c9a227" }} /> Round Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Entries",      val: String(summary.totalEntries), color: "#2563eb" },
                { label: "Scored",       val: String(summary.scored),       color: "#16a34a" },
                { label: "Avg Score",    val: String(summary.avgScore),     color: "#c9a227" },
                { label: "Qualified",    val: String(summary.qualified),    color: "#4ade80" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-xs mt-1" style={{ color: "#4b5563" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Criteria averages */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Star className="h-4 w-4" style={{ color: "#c9a227" }} /> Criteria Averages</h2>
            <div className="space-y-3">
              {(criteriaAverages ?? []).map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white">{c.label}</span>
                    <span className="text-sm font-bold" style={{ color: "#c9a227" }}>{c.avg}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.avg / maxAvg) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.06 }}
                      style={{ background: "linear-gradient(90deg, #c9a227, #f5c842)" }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Country breakdown */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-semibold text-white flex items-center gap-2"><Users className="h-4 w-4" style={{ color: "#c9a227" }} /> Performance by Country</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {(countries ?? []).map(c => (
                <div key={c.name} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs" style={{ color: "#4b5563" }}>{c.entries} {c.entries === 1 ? "entry" : "entries"}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: c.avgScore ? "#c9a227" : "#4b5563" }}>
                    {c.avgScore ? `${c.avgScore} avg` : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top & lowest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <p className="text-xs font-medium mb-3" style={{ color: "#4b5563" }}>🏆 Highest Score</p>
              <p className="text-lg font-bold text-white">{summary.highest.name}</p>
              <p className="text-xs mb-2" style={{ color: "#6b7280" }}>{summary.highest.flag} {summary.highest.country}</p>
              <p className="text-3xl font-bold" style={{ color: "#4ade80" }}>{summary.highest.score}<span className="text-base font-normal" style={{ color: "#374151" }}>/10</span></p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-medium mb-3" style={{ color: "#4b5563" }}>Lowest Score</p>
              <p className="text-lg font-bold text-white">{summary.lowest.name}</p>
              <p className="text-xs mb-2" style={{ color: "#6b7280" }}>{summary.lowest.flag} {summary.lowest.country}</p>
              <p className="text-3xl font-bold" style={{ color: "#9ca3af" }}>{summary.lowest.score}<span className="text-base font-normal" style={{ color: "#374151" }}>/10</span></p>
            </div>
          </div>

          {/* Judge notes */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><FileText className="h-4 w-4" style={{ color: "#c9a227" }} /> Judge Notes</h2>
            <textarea rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any overall observations or notes for this round…"
              className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:ring-1 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
        </div>

        {/* Right — actions */}
        <div className="space-y-5 print:hidden">

          {/* Generate report */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="font-semibold text-white mb-1">Generate Report</h3>
            <p className="text-xs mb-5" style={{ color: "#4b5563" }}>Compile your scores and notes into an official report</p>

            <div className="space-y-2 mb-5">
              {[
                "Weighted scores per participant",
                "Criteria breakdown",
                "Country performance analysis",
                "Judge notes & observations",
                "Qualification recommendation",
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs" style={{ color: "#9ca3af" }}>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#4ade80" }} />
                  {item}
                </div>
              ))}
            </div>

            {generated ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl py-3 text-center text-sm font-semibold mb-3"
                style={{ background: "rgba(22,163,74,0.1)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.25)" }}>
                <CheckCircle2 className="h-4 w-4 inline mr-1" /> Report Ready
              </motion.div>
            ) : (
              <button onClick={generate} disabled={generating}
                className="w-full py-3 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-50 mb-3"
                style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)", boxShadow: "0 4px 16px rgba(201,162,39,0.25)" }}>
                {generating ? "Generating…" : "Generate Report"}
              </button>
            )}

            {generated && (
              <div className="space-y-2">
                {[
                  { icon: Download, label: "Download PDF", action: handleDownloadPDF },
                  { icon: Printer, label: "Print Report", action: handlePrint },
                  { icon: Send, label: "Submit to Admin", action: handleSubmit },
                ].map(action => (
                  <button key={action.label} onClick={action.action}
                    disabled={action.label === "Submit to Admin" ? submitting : false}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <action.icon className="h-4 w-4" />
                    {action.label === "Submit to Admin" && submitting ? "Submitting…" : action.label === "Submit to Admin" && submitted ? "Submitted" : action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Scoring Completion</h3>
              <span className="text-sm font-bold" style={{ color: "#c9a227" }}>
                {Math.round((summary.scored / summary.totalEntries) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(summary.scored / summary.totalEntries) * 100}%` }}
                transition={{ duration: 1 }}
                style={{ background: "linear-gradient(90deg, #c9a227, #f5c842)" }} />
            </div>
            <p className="text-xs" style={{ color: "#4b5563" }}>{summary.scored} of {summary.totalEntries} entries scored</p>
          </div>

          {/* Status note */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.15)" }}>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4" style={{ color: "#c9a227" }} />
              <p className="text-xs font-semibold text-white">Report Policy</p>
            </div>
            <p className="text-xs" style={{ color: "#4b5563" }}>Reports are final and submitted to the competition director. Scores cannot be modified after submission.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
