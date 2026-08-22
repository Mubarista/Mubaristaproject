"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, AlertTriangle, CheckCircle2, X, Gavel, Eye, FileCheck } from "lucide-react";

interface JudgeTermsDialogProps {
  judgeName: string;
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const SECTIONS = [
  {
    id: "terms",
    icon: ScrollText,
    title: "Terms & Conditions",
    color: "#c9a227",
    items: [
      "I will judge all participant videos fairly, impartially, and without bias.",
      "I will score each participant based solely on the published criteria and my honest assessment.",
      "I understand that once a score is submitted, it cannot be changed or undone.",
      "I will not share participant videos, scores, or feedback outside the judging panel.",
      "I will complete scoring for each participant before moving to the next.",
      "I will not skip participants or return to previously scored participants.",
      "I understand the scoring system is synchronized: the next video becomes available only after all judges finish the current one.",
    ],
  },
  {
    id: "guidelines",
    icon: Gavel,
    title: "Full Judging Guidelines",
    color: "#3b82f6",
    items: [
      "Watch each video completely before assigning scores.",
      "Score each criterion independently using the 1–10 scale.",
      "Consider creativity, technique, presentation, and adherence to the competition theme.",
      "Provide constructive feedback when requested, keeping comments professional and respectful.",
      "Do not refresh the page during scoring as this may interrupt the synchronized queue.",
      "If a video fails to load, report the issue to the admin and wait for instructions.",
      "Your scores contribute to the final ranking alongside all other assigned judges.",
    ],
  },
  {
    id: "warnings",
    icon: AlertTriangle,
    title: "Strict Warnings",
    color: "#ef4444",
    items: [
      "WARNING: Scores are final. There is no undo or edit option after submission.",
      "WARNING: Do not attempt to access the scoring panel using multiple devices or sessions.",
      "WARNING: Skipping, going back, or manipulating the queue is not permitted.",
      "WARNING: Any violation of judging integrity may result in removal and disqualification of scores.",
      "WARNING: You must finish scoring the current participant before the next one is revealed.",
      "WARNING: The system tracks every scoring action for audit and fairness purposes.",
    ],
  },
];

export function JudgeTermsDialog({ judgeName, open, onAccept, onDecline }: JudgeTermsDialogProps) {
  const [activeTab, setActiveTab] = useState("terms");
  const [scrolled, setScrolled] = useState<Record<string, boolean>>({ terms: false, guidelines: false, warnings: false });
  const [checked, setChecked] = useState(false);

  const activeSection = SECTIONS.find(s => s.id === activeTab) || SECTIONS[0];
  const allScrolled = scrolled.terms && scrolled.guidelines && scrolled.warnings;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDecline} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,162,39,0.15)" }}>
                <FileCheck className="h-5 w-5" style={{ color: "#c9a227" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Judging Agreement</h2>
                <p className="text-xs" style={{ color: "#6b7280" }}>Welcome, <span className="text-white font-medium">{judgeName}</span>. Please review and accept.</p>
              </div>
            </div>
            <button onClick={onDecline} className="p-2 rounded-xl transition-colors" style={{ color: "#6b7280" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeTab === section.id;
            const isRead = scrolled[section.id];
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-t-xl text-xs font-medium transition-all"
                style={isActive
                  ? { background: "rgba(255,255,255,0.05)", color: section.color, borderBottom: `2px solid ${section.color}` }
                  : { color: "#6b7280" }
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{section.title}</span>
                <span className="sm:hidden">{section.title.split(" ")[0]}</span>
                {isRead && <CheckCircle2 className="h-3 w-3" style={{ color: "#4ade80" }} />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <activeSection.icon className="h-4 w-4" style={{ color: activeSection.color }} />
            <h3 className="font-semibold text-white">{activeSection.title}</h3>
            {!scrolled[activeTab] && (
              <span className="text-xs ml-auto" style={{ color: "#f59e0b" }}>
                <Eye className="h-3 w-3 inline mr-1" />
                Scroll to the bottom to mark as read
              </span>
            )}
          </div>
          <div
            className="space-y-3 max-h-[38vh] overflow-y-auto pr-2 text-sm"
            onScroll={(e) => {
              const el = e.currentTarget;
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
              if (nearBottom) {
                setScrolled(prev => ({ ...prev, [activeTab]: true }));
              }
            }}
            style={{ color: "#9ca3af" }}
          >
            {activeSection.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: activeSection.color + "20", color: activeSection.color }}>
                  {i + 1}
                </span>
                <p className="leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <label className="flex items-start gap-3 text-sm cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={!allScrolled}
              className="mt-1 h-4 w-4 rounded border-white/20 text-yellow-600 focus:ring-yellow-500 disabled:opacity-30"
            />
            <span style={{ color: allScrolled ? "#e5e7eb" : "#6b7280" }}>
              I have read, understood, and agree to the Terms & Conditions, Judging Guidelines, and Warnings.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Decline & Exit
            </button>
            <button
              onClick={onAccept}
              disabled={!checked || !allScrolled}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)" }}
            >
              Accept & Proceed to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}