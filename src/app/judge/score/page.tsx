"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Play, ChevronLeft, ChevronRight, MessageSquare,
  CheckCircle2, RotateCcw, Send,
} from "lucide-react";
import { useJudgeAuth } from "@/lib/judge-auth-context";

type Scores = Record<string, number>;

type Criterion = { key: string; label: string; weight: number; desc: string };

function ScoreSlider({ score, onChange }: { score: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className="h-7 w-7 rounded-lg text-xs font-bold transition-all"
            style={n <= score
              ? { background: "linear-gradient(135deg, #c9a227, #f5c842)", color: "#000" }
              : { background: "rgba(255,255,255,0.05)", color: "#4b5563", border: "1px solid rgba(255,255,255,0.07)" }}>
            {n}
          </button>
        ))}
      </div>
      <span className="text-lg font-bold min-w-[2.5rem] text-right" style={{ color: score >= 9 ? "#4ade80" : score >= 7 ? "#c9a227" : score >= 5 ? "#f97316" : "#ef4444" }}>
        {score}/10
      </span>
    </div>
  );
}

function weightedTotal(scores: Scores, criteria: Criterion[]): number {
  let total = 0;
  criteria.forEach(c => {
    const s = scores[c.key] ?? 0;
    total += (s / 10) * c.weight;
  });
  return Math.round(total * 10) / 10;
}

type VideoType = "video" | "youtube" | "vimeo" | "none";

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
      const v = u.searchParams.get("v");
      if (v) return v;
    }
  } catch {
    return null;
  }
  return null;
}

function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const match = u.pathname.match(/\/(?:video\/)?(\d+)$/);
      if (match) return match[1];
    }
  } catch {
    return null;
  }
  return null;
}

function getVideoType(url?: string): VideoType {
  if (!url) return "none";
  if (getYouTubeId(url) || getVimeoId(url)) return "video";
  if (url.match(/\.(mp4|webm|mov|mkv|ogv|m3u8)(\?.*)?$/i)) return "video";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return "video";
  return "none";
}

export default function ScorePage() {
  const { judgeName, judgeId } = useJudgeAuth();
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<Record<string, Scores>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [queue, setQueue] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [videoError, setVideoError] = useState(false);
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  type Submission = {
    id: string;
    applicationId: string;
    name: string;
    country: string;
    flag?: string;
    category?: string;
    duration?: string;
    videoUrl?: string;
    status: "pending" | "scored";
    score: number | null;
    criteriaScores: Scores;
    feedback: string;
  };

  type Competition = {
    id: string;
    title: string;
    round: string;
    deadline: string;
    totalEntries: number;
    scored: number;
    pending: number;
    difficulty?: string;
    rules: string[];
    criteria: Criterion[];
  };

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/judge/portal?judgeId=${judgeId}`);
      if (res.ok) {
        const data = await res.json();
        const submissions = (data.submissions || []) as Submission[];
        setQueue(submissions);
        setCompetition(data.competition || null);
        setCriteria(data.competition?.criteria || []);

        // Load existing scores and comments
        const initialScores: Record<string, Scores> = {};
        const initialComments: Record<string, string> = {};
        const submittedStatus: Record<string, boolean> = {};
        submissions.forEach((s) => {
          initialScores[s.applicationId || s.id] = s.criteriaScores || {};
          initialComments[s.applicationId || s.id] = s.feedback || "";
          if (s.status === "scored") {
            submittedStatus[s.applicationId || s.id] = true;
          }
        });
        setScores(initialScores);
        setComments(initialComments);
        setSubmitted(submittedStatus);
      }
    } catch (error) {
      console.error("Error fetching judge queue:", error);
    } finally {
      setLoading(false);
    }
  }, [judgeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueue();
  }, [judgeId, fetchQueue]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVideoError(false);
    setStarted(false);
  }, [current]);

  const entry = queue[current] || { id: "", name: "No entries", country: "", flag: "", category: "", duration: "" };
  const entryScores: Scores = scores[entry.applicationId || entry.id] ?? {};
  const entryComment = comments[entry.applicationId || entry.id] ?? "";
  const isSubmitted = submitted[entry.applicationId || entry.id] ?? false;
  const allFilled = criteria.length > 0 && criteria.every(c => (entryScores[c.key] ?? 0) > 0);
  const total = weightedTotal(entryScores, criteria);

  function setScore(key: string, val: number) {
    const id = entry.applicationId || entry.id;
    setScores(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), [key]: val } }));
  }

  function reset() {
    const id = entry.applicationId || entry.id;
    setScores(prev => ({ ...prev, [id]: {} }));
    setComments(prev => ({ ...prev, [id]: "" }));
  }

  async function submit() {
    if (!allFilled || !judgeId) return;
    
    setSubmitting(true);
    try {
      const id = entry.applicationId || entry.id;
      
      const res = await fetch("/api/judge/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeId,
          applicationId: id,
          competitionId: competition?.id,
          participantName: entry.name,
          score: total,
          comments: entryComment,
          criteriaScores: entryScores,
        }),
      });
      
      if (res.ok) {
        setSubmitted(prev => ({ ...prev, [id]: true }));
      }
    } catch (error) {
      console.error("Error submitting score:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  if (queue.length === 0) {
    return (
      <div className="p-8 min-h-screen">
        <div className="mb-6">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(201,162,39,0.15)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.3)" }}>
            SCORING PANEL
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">Score Submissions</h1>
        </div>
        <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white">No pending submissions to score</p>
          <a href="/judge" className="inline-block mt-4 text-sm" style={{ color: "#c9a227" }}>Return to Judge Portal</a>
        </div>
      </div>
    );
  }

  const pendingCount = queue ? queue.filter(q => !submitted[q.applicationId || q.id]).length : 0;

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(201,162,39,0.15)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.3)" }}>
            SCORING PANEL
          </span>
          <span className="text-xs" style={{ color: "#4b5563" }}>· {pendingCount} entries pending</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Score Submissions</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>Signed in as <span style={{ color: "#c9a227" }}>{judgeName}</span></p>
      </div>

      {/* Queue navigator */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {queue && queue.map((q, i) => (
          <button key={q.applicationId || q.id} onClick={() => setCurrent(i)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0"
            style={i === current
              ? { background: "rgba(201,162,39,0.2)", color: "#f5c842", border: "1px solid rgba(201,162,39,0.35)" }
              : submitted[q.applicationId || q.id]
                ? { background: "rgba(22,163,74,0.1)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.25)" }
                : { background: "rgba(255,255,255,0.03)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)" }}>
            {submitted[q.applicationId || q.id] ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
            {q.flag} {q.name.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: video + info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video preview */}
          {(() => {
            const videoType = getVideoType(entry.videoUrl);
            const ytId = videoType === "video" ? getYouTubeId(entry.videoUrl || "") : null;
            const vimeoId = videoType === "video" ? getVimeoId(entry.videoUrl || "") : null;
            const isEmbed = Boolean(ytId || vimeoId);
            const isNative = videoType === "video" && !isEmbed;

            function handlePlay() {
              if (!entry.videoUrl) return;
              if (videoError) {
                window.open(entry.videoUrl, "_blank", "noopener,noreferrer");
              } else if (isNative) {
                setStarted(true);
                videoRef.current?.play().catch(() => setVideoError(true));
              } else if (isEmbed) {
                setStarted(true);
              } else {
                window.open(entry.videoUrl, "_blank", "noopener,noreferrer");
              }
            }

            return (
              <div className="rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0d1117, #161b22)" }}>
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 50% 40%, rgba(201, 162, 39, 0.25), transparent 60%)" }} />

                {isNative && !videoError && (
                  <video
                    ref={videoRef}
                    key={entry.id}
                    src={entry.videoUrl}
                    controls
                    preload="metadata"
                    onError={() => { setVideoError(true); setStarted(false); }}
                    onPlay={() => setStarted(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {started && isEmbed && ytId && (
                  <iframe
                    key={entry.id}
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&rel=0`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                )}

                {started && isEmbed && vimeoId && (
                  <iframe
                    key={entry.id}
                    src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&title=0&byline=0&portrait=0`}
                    title="Vimeo video player"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                )}

                {(!started || videoError) && (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center px-4 cursor-pointer"
                    onClick={handlePlay}
                    style={{ background: "rgba(13,17,23,0.35)" }}
                  >
                    <div className="h-16 w-16 rounded-full flex items-center justify-center transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)", boxShadow: "0 0 40px rgba(201,162,39,0.4)" }}>
                      <Play className="h-7 w-7 text-black ml-1" />
                    </div>
                    {entry.videoUrl ? (
                      <a
                        href={entry.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-medium text-white hover:underline break-all"
                      >
                        {videoError ? "Open video URL" : "Play video"}
                      </a>
                    ) : (
                      <p className="text-xs font-medium text-white">{competition?.title || entry.category}</p>
                    )}
                    {entry.duration && <p className="text-xs" style={{ color: "#6b7280" }}>{entry.duration}</p>}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Participant info */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold text-black"
                style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)" }}>
                {entry.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white">{entry.name}</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>{entry.flag} {entry.country}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p style={{ color: "#4b5563" }}>Competition</p>
                <p className="font-medium text-white mt-0.5 leading-tight">{competition?.title || entry.category}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p style={{ color: "#4b5563" }}>Level</p>
                <p className="font-medium text-white mt-0.5">{competition?.difficulty || entry.duration || "—"}</p>
              </div>
            </div>
          </div>

          {/* Running total */}
          <div className="rounded-2xl p-5" style={{ background: allFilled ? "rgba(201,162,39,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${allFilled ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.07)"}` }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Weighted Total</p>
            <p className="text-4xl font-bold" style={{ color: allFilled ? "#f5c842" : "#374151" }}>
              {allFilled ? total : "—"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#4b5563" }}>Based on criteria weights</p>
          </div>
        </div>

        {/* Right: scoring */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-semibold text-white">Scoring Criteria</h2>
              <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>Each criterion is weighted. Score 1–10 per category.</p>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {criteria.length === 0 && (
                <div className="px-5 py-4 text-sm" style={{ color: "#6b7280" }}>
                  No judging criteria configured for this competition.
                </div>
              )}
              {criteria.map(c => (
                <div key={c.key} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-white">{c.label}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(201,162,39,0.1)", color: "#c9a227" }}>
                      {c.weight}%
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#4b5563" }}>{c.desc}</p>
                  {isSubmitted ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <div key={n} className="h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center"
                            style={n <= (entryScores[c.key] ?? 0)
                              ? { background: "linear-gradient(135deg, #c9a227, #f5c842)", color: "#000", opacity: 0.6 }
                              : { background: "rgba(255,255,255,0.03)", color: "#374151" }}>
                            {n}
                          </div>
                        ))}
                      </div>
                      <span className="text-base font-bold ml-1" style={{ color: "#c9a227" }}>{entryScores[c.key]}/10</span>
                    </div>
                  ) : (
                    <ScoreSlider score={entryScores[c.key] ?? 0} onChange={v => setScore(c.key, v)} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" style={{ color: "#6b7280" }} />
              <h3 className="text-sm font-semibold text-white">Judge Feedback</h3>
            </div>
            <textarea rows={3} disabled={isSubmitted}
              value={entryComment}
              onChange={e => setComments(prev => ({ ...prev, [entry.id]: e.target.value }))}
              placeholder="Optional feedback for the participant…"
              className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:ring-1 transition-all disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!isSubmitted ? (
              <>
                <button onClick={reset}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
                <button onClick={submit} disabled={!allFilled || submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-40"
                  style={{ background: allFilled ? "linear-gradient(135deg, #c9a227, #f5c842)" : "#1f2937", boxShadow: allFilled ? "0 4px 20px rgba(201,162,39,0.3)" : "none" }}>
                  {submitting ? <span>Submitting...</span> : <><Send className="h-4 w-4" /> Submit Score</>}
                </button>
              </>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                  style={{ background: "rgba(22,163,74,0.12)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.3)" }}>
                  <CheckCircle2 className="h-4 w-4" /> Score Submitted — {total}/10
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Prev / Next */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-30"
              style={{ color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)" }}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="text-xs" style={{ color: "#4b5563" }}>{current + 1} / {queue.length}</span>
            <button onClick={() => setCurrent(Math.min(queue.length - 1, current + 1))} disabled={current === queue.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-30"
              style={{ color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)" }}>
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
