"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Copy, CheckCircle2, Eye, EyeOff,
  ShieldCheck, ShieldOff, Clock, AlertTriangle, X, Save, RefreshCw, Scale, Link as LinkIcon, Search, FileText, ArrowLeft,
} from "lucide-react";
import { useAdminData } from "@/lib/admin-data-context";
import type { JudgeCredential, JudgeReport } from "@/types";
import { Button } from "@/components/ui/button";

/* ── helpers ── */
function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function genToken() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function buildLink(origin: string, token: string) {
  return `${origin}/judge?token=${token}`;
}

function expiryStatus(expiresAt: string | null, active: boolean): {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode;
} {
  if (!active) return { label: "Disabled",  color: "#ef4444", bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.25)",  icon: <ShieldOff className="h-3.5 w-3.5" /> };
  if (!expiresAt) return { label: "Active · No expiry", color: "#4ade80", bg: "rgba(22,163,74,0.1)", border: "rgba(22,163,74,0.25)", icon: <ShieldCheck className="h-3.5 w-3.5" /> };
  const exp = new Date(expiresAt); exp.setHours(23, 59, 59, 999);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
  if (exp < now)   return { label: "Expired",            color: "#ef4444", bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.25)",  icon: <AlertTriangle className="h-3.5 w-3.5" /> };
  if (daysLeft <= 14) return { label: `Expires in ${daysLeft}d`, color: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.25)", icon: <Clock className="h-3.5 w-3.5" /> };
  return { label: `Active · ${daysLeft}d left`, color: "#4ade80", bg: "rgba(22,163,74,0.1)", border: "rgba(22,163,74,0.25)", icon: <ShieldCheck className="h-3.5 w-3.5" /> };
}

const EMPTY: Omit<JudgeCredential, "id" | "createdAt"> = {
  name: "", username: "", password: "", expiresAt: "", assignedCompetition: "", active: true, notes: "", accessToken: null, accessLinkExpiresAt: null,
};

/* ── Modal ── */
function CredentialModal({
  initial, onSave, onClose,
}: {
  initial: JudgeCredential | null;
  onSave: (c: JudgeCredential) => void;
  onClose: () => void;
}) {
  const { competitions } = useAdminData();
  const isNew = !initial;
  const [form, setForm] = useState<Omit<JudgeCredential, "id" | "createdAt">>(
    initial
      ? { 
          name: initial.name || "", 
          username: initial.username || "", 
          password: initial.password || "", 
          expiresAt: initial.expiresAt ?? "", 
          assignedCompetition: initial.assignedCompetition || "", 
          active: initial.active, 
          notes: initial.notes || "", 
          accessToken: initial.accessToken || null, 
          accessLinkExpiresAt: initial.accessLinkExpiresAt || null 
        }
      : { ...EMPTY, password: genPassword() }
  );
  const [showPwd, setShowPwd] = useState(isNew);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim())     e.name = "Name is required";
    if (!form.username.trim()) e.username = "Username is required";
    if (form.username.includes(" ")) e.username = "No spaces in username";
    if (!form.password.trim()) e.password = "Password is required";
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function save() {
    if (!validate()) return;
    onSave({
      ...(initial ?? { id: genUUID(), createdAt: new Date().toISOString().slice(0, 10) }),
      ...form,
      expiresAt: form.expiresAt || null,
    });
  }

  function set(field: keyof typeof form, val: string | boolean) {
    setForm(prev => ({ ...prev, [field]: val }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,162,39,0.15)" }}>
              <Scale className="h-5 w-5" style={{ color: "#c9a227" }} />
            </div>
            <div>
              <h2 className="font-bold text-white">{isNew ? "New Judge Credential" : "Edit Credential"}</h2>
              <p className="text-xs" style={{ color: "#4b5563" }}>{isNew ? "Create access for a new judge" : `Editing: ${initial?.name}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: "#6b7280" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>Full Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Iraguha Mugisha"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${errors.name ? "#ef4444" : "rgba(255,255,255,0.1)"}` }} />
            {errors.name && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>Username *</label>
            <input value={form.username} onChange={e => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="e.g. judge_Mubarak"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${errors.username ? "#ef4444" : "rgba(255,255,255,0.1)"}` }} />
            {errors.username && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: "#9ca3af" }}>Password *</label>
              <button type="button" onClick={() => set("password", genPassword())}
                className="flex items-center gap-1 text-xs transition-colors" style={{ color: "#c9a227" }}>
                <RefreshCw className="h-3 w-3" /> Generate
              </button>
            </div>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={form.password}
                onChange={e => set("password", e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm text-white font-mono focus:outline-none focus:ring-1 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${errors.password ? "#ef4444" : "rgba(255,255,255,0.1)"}` }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#6b7280" }}>
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.password}</p>}
          </div>

          {/* Expiry + Active row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>Expiry Date</label>
              <input type="date" value={form.expiresAt ?? ""}
                onChange={e => set("expiresAt", e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }} />
              <p className="text-xs mt-1" style={{ color: "#4b5563" }}>Leave blank = no expiry</p>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>Account Status</label>
              <button type="button" onClick={() => set("active", !form.active)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={form.active
                  ? { background: "rgba(22,163,74,0.12)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.3)" }
                  : { background: "rgba(220,38,38,0.08)", color: "#ef4444", border: "1px solid rgba(220,38,38,0.25)" }}>
                {form.active ? <><ShieldCheck className="h-4 w-4" /> Active</> : <><ShieldOff className="h-4 w-4" /> Disabled</>}
                <span className={`h-4 w-8 rounded-full relative transition-colors ${form.active ? "" : ""}`}
                  style={{ background: form.active ? "#16a34a" : "#374151" }}>
                  <span className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
                    style={{ left: form.active ? "calc(100% - 14px)" : "2px" }} />
                </span>
              </button>
            </div>
          </div>

          {/* Assigned competition */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>Assigned Competition</label>
            <select
              value={form.assignedCompetition || ""}
              onChange={e => set("assignedCompetition", e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition-all appearance-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <option value="" style={{ color: "#000" }}>Select a competition...</option>
              {competitions
                .filter(c => c.status !== "completed")
                .sort((a, b) => a.title.localeCompare(b.title))
                .map(c => (
                  <option key={c.id} value={c.id} style={{ color: "#000" }}>
                    {c.title} {c.status ? `(${c.status})` : ""}
                  </option>
                ))}
            </select>
            {competitions.filter(c => c.status !== "completed").length === 0 && (
              <p className="text-xs mt-1" style={{ color: "#ef4444" }}>No currently available competitions.</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>Notes</label>
            <textarea rows={2} value={form.notes || ""} onChange={e => set("notes", e.target.value)}
              placeholder="Optional internal notes…"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-1 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
        </div>

        <div className="px-6 py-4 flex gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" }}>
            Cancel
          </button>
          <button onClick={save}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-black transition-all"
            style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)", boxShadow: "0 4px 16px rgba(201,162,39,0.25)" }}>
            <Save className="h-4 w-4" /> {isNew ? "Create Credential" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Link Modal ── */
function LinkModal({
  credential, onSave, onClose,
}: {
  credential: JudgeCredential;
  onSave: (c: JudgeCredential) => void;
  onClose: () => void;
}) {
  const [linkExpiry, setLinkExpiry] = useState(() => {
    if (credential.accessLinkExpiresAt) return credential.accessLinkExpiresAt;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const [now] = useState(() => Date.now());

  function generate() {
    const token = genToken();
    console.log("[LinkModal.generate] Generated token:", token);
    console.log("[LinkModal.generate] Link expiry:", linkExpiry);
    const updated: JudgeCredential = { ...credential, accessToken: token, accessLinkExpiresAt: linkExpiry || null };
    console.log("[LinkModal.generate] Updated credential:", { id: updated.id, name: updated.name, accessToken: updated.accessToken, accessLinkExpiresAt: updated.accessLinkExpiresAt });
    onSave(updated);
    setLink(buildLink(origin, token));
    console.log("[LinkModal.generate] Link set:", buildLink(origin, token));
  }

  function regenerate() {
    generate();
  }

  function revoke() {
    const updated: JudgeCredential = { ...credential, accessToken: null, accessLinkExpiresAt: null };
    onSave(updated);
    setLink(null);
  }

  function copy() {
    if (!currentLink) return;
    navigator.clipboard.writeText(currentLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const existingLink = credential.accessToken ? buildLink(origin, credential.accessToken) : null;
  const currentLink = link ?? existingLink;
  const linkExpired = credential.accessLinkExpiresAt
    ? new Date(credential.accessLinkExpiresAt).setHours(23, 59, 59, 999) < now
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,162,39,0.15)" }}>
              <LinkIcon className="h-5 w-5" style={{ color: "#c9a227" }} />
            </div>
            <div>
              <h2 className="font-bold text-white">Access Link</h2>
              <p className="text-xs" style={{ color: "#4b5563" }}>{credential.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: "#6b7280" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-white">
            Judges can only enter the portal using the link below. Direct access to <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">/judge</code> is blocked without this token.
          </p>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>Link Expiry</label>
            <input type="date" value={linkExpiry || ""} onChange={e => setLinkExpiry(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }} />
            <p className="text-xs mt-1" style={{ color: "#4b5563" }}>Leave blank for a link that never expires</p>
          </div>

          {currentLink ? (
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${linkExpired ? "rgba(220,38,38,0.25)" : "rgba(22,163,74,0.25)"}` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: linkExpired ? "#ef4444" : "#4ade80" }}>
                  {linkExpired ? "Link expired" : "Link active"}
                </p>
                {credential.accessLinkExpiresAt && (
                  <p className="text-xs" style={{ color: "#6b7280" }}>Expires {credential.accessLinkExpiresAt}</p>
                )}
              </div>
              <code className="block w-full text-xs font-mono break-all p-3 rounded-xl mb-3" style={{ background: "rgba(0,0,0,0.3)", color: "#e5e7eb" }}>
                {currentLink}
              </code>
              <div className="flex gap-2">
                <button onClick={copy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-black transition-all"
                  style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)" }}>
                  {copied ? <><CheckCircle2 className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy Link</>}
                </button>
                <button onClick={regenerate}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button onClick={revoke}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#ef4444", border: "1px solid rgba(220,38,38,0.15)" }}>
                  <ShieldOff className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={generate}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black transition-all"
              style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)", boxShadow: "0 4px 16px rgba(201,162,39,0.25)" }}>
              <LinkIcon className="h-4 w-4" /> Generate Access Link
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Reports Modal ── */
function ReportsModal({
  open,
  reports,
  selectedReport,
  loading,
  onClose,
  onSelect,
  onBack,
}: {
  open: boolean;
  reports: JudgeReport[];
  selectedReport: JudgeReport | null;
  loading: boolean;
  onClose: () => void;
  onSelect: (r: JudgeReport) => void;
  onBack: () => void;
}) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  if (!open) return null;

  function handleSelect(r: JudgeReport) {
    setPublishing(false);
    setPublished(false);
    onSelect(r);
  }

  function handleBack() {
    setPublishing(false);
    setPublished(false);
    onBack();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusBadge(status: JudgeReport["status"]) {
    if (status === "submitted") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: "rgba(22,163,74,0.1)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.25)" }}>
          Submitted
        </span>
      );
    }
    if (status === "generated") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>
          Generated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
        Draft
      </span>
    );
  }

  async function publishWinner() {
    if (!selectedReport?.summary?.highest) return;
    setPublishing(true);
    try {
      const winner = selectedReport.summary.highest;
      const payload = {
        name: winner.name,
        competition: selectedReport.competitionTitle || "—",
        country: winner.country || "",
        image: "",
        winDate: new Date().toISOString().slice(0, 10),
        prize: "",
        currency: "RWF",
        winType: "competition",
        year: new Date().getFullYear().toString(),
      };
      const res = await fetch("/api/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setPublished(true);
      } else {
        console.error("Failed to publish winner");
      }
    } catch (error) {
      console.error("Error publishing winner:", error);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            {selectedReport ? (
              <button onClick={handleBack} className="p-2 rounded-xl transition-colors" style={{ color: "#6b7280" }}>
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,162,39,0.15)" }}>
                <FileText className="h-5 w-5" style={{ color: "#c9a227" }} />
              </div>
            )}
            <div>
              <h2 className="font-bold text-white">{selectedReport ? "Report Detail" : "Judge Reports"}</h2>
              <p className="text-xs" style={{ color: "#4b5563" }}>
                {selectedReport ? `${selectedReport.judgeName} — ${selectedReport.competitionTitle || "—"}` : `${reports.length} report${reports.length === 1 ? "" : "s"} available`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: "#6b7280" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {!selectedReport ? (
              <motion.div key="list"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {loading ? (
                  <div className="py-16 text-center text-muted">
                    <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin" style={{ color: "#c9a227" }} />
                    <p>Loading reports...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-16 text-center">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-muted/40" />
                    <p className="text-muted">No reports yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <button key={report.id} onClick={() => handleSelect(report)}
                        className="w-full text-left glass-card rounded-2xl p-4 transition-all hover:bg-white/5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-sm text-white">{report.judgeName}</p>
                            <p className="text-xs text-muted mt-0.5">{report.competitionTitle || "—"}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {statusBadge(report.status)}
                            <span className="text-xs" style={{ color: "#6b7280" }}>{formatDate(report.createdAt)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="detail"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: "Total Entries", value: selectedReport.summary?.totalEntries ?? 0, color: "#c9a227" },
                    { label: "Scored", value: selectedReport.summary?.scored ?? 0, color: "#60a5fa" },
                    { label: "Average Score", value: selectedReport.summary?.avgScore ?? "—", color: "#4ade80" },
                    { label: "Qualified", value: selectedReport.summary?.qualified ?? 0, color: "#f5c842" },
                  ].map((k) => (
                    <div key={k.label} className="glass-card rounded-2xl p-4 text-center">
                      <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
                      <p className="text-xs text-muted mt-1">{k.label}</p>
                    </div>
                  ))}
                </div>

                {selectedReport.summary?.highest && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted mb-2">Highest Scoring Entry (Winner)</p>
                        <p className="font-semibold text-white">{selectedReport.summary.highest.flag} {selectedReport.summary.highest.name}</p>
                        <p className="text-xs mt-1" style={{ color: "#4ade80" }}>Score: {selectedReport.summary.highest.score}</p>
                      </div>
                      <button
                        onClick={publishWinner}
                        disabled={publishing || published}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: published ? "rgba(22,163,74,0.15)" : "rgba(201,162,39,0.15)",
                          color: published ? "#4ade80" : "#f5c842",
                          border: `1px solid ${published ? "rgba(22,163,74,0.3)" : "rgba(201,162,39,0.3)"}`
                        }}
                      >
                        {publishing ? "Publishing..." : published ? "Published" : "Publish Winner"}
                      </button>
                    </div>
                    <div className="glass-card rounded-2xl p-4">
                      <p className="text-xs text-muted mb-2">Lowest Scoring Entry</p>
                      <p className="font-semibold text-white">{selectedReport.summary.lowest.flag} {selectedReport.summary.lowest.name}</p>
                      <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Score: {selectedReport.summary.lowest.score}</p>
                    </div>
                  </div>
                )}

                {/* Criteria averages */}
                <div className="glass-card rounded-2xl p-4 mb-5">
                  <h3 className="font-semibold text-white mb-3">Criteria Averages</h3>
                  {selectedReport.criteriaAverages && selectedReport.criteriaAverages.length > 0 ? (
                    <div className="space-y-3">
                      {selectedReport.criteriaAverages.map((c) => (
                        <div key={c.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white">{c.label}</span>
                            <span className="text-sm font-semibold" style={{ color: "#c9a227" }}>{c.avg.toFixed(2)}</span>
                          </div>
                          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, c.avg))}%`, background: "#c9a227" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No criteria averages available.</p>
                  )}
                </div>

                {/* Country breakdown */}
                <div className="glass-card rounded-2xl overflow-hidden mb-5">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="font-semibold text-white">Country Breakdown</h3>
                  </div>
                  {selectedReport.countries && selectedReport.countries.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {selectedReport.countries.map((country) => (
                        <div key={country.name} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-sm text-white">{country.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-muted">{country.entries} entries</span>
                            <span className="font-medium" style={{ color: "#4ade80" }}>avg {country.avgScore.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-muted text-sm">No country breakdown available.</div>
                  )}
                </div>

                {/* Judge notes */}
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="font-semibold text-white mb-2">Judge Notes</h3>
                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {selectedReport.notes || "No notes provided."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main page ── */
export default function JudgesPage() {
  const { judgeCredentials, setJudgeCredentials, competitions } = useAdminData();
  const [modal, setModal] = useState<{ open: boolean; editing: JudgeCredential | null }>({ open: false, editing: null });
  const [linkModal, setLinkModal] = useState<{ open: boolean; credential: JudgeCredential | null }>({ open: false, credential: null });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPwdFor, setShowPwdFor] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");

  const [reports, setReports] = useState<JudgeReport[]>([]);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<JudgeReport | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  const filteredJudgeCredentials = judgeCredentials.filter(cred => {
    const searchTerm = search.toLowerCase();
    return (
      cred.name.toLowerCase().includes(searchTerm) ||
      cred.username.toLowerCase().includes(searchTerm) ||
      (cred.assignedCompetition && cred.assignedCompetition.toLowerCase().includes(searchTerm))
    );
  });

  function openCreate() { setModal({ open: true, editing: null }); }
  function openEdit(c: JudgeCredential) { setModal({ open: true, editing: c }); }
  function closeModal() { setModal({ open: false, editing: null }); }
  function openLink(c: JudgeCredential) { setLinkModal({ open: true, credential: c }); }
  function closeLinkModal() { setLinkModal({ open: false, credential: null }); }

  async function fetchReports() {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/admin/judge-reports");
      if (res.ok) {
        const data: JudgeReport[] = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoadingReports(false);
    }
  }

  function closeReportsModal() { setReportsModalOpen(false); setSelectedReport(null); }
  function selectReport(r: JudgeReport) { setSelectedReport(r); }
  function backToReports() { setSelectedReport(null); }

  async function saveCredential(c: JudgeCredential) {
    try {
      const response = await fetch("/api/judges", {
        method: judgeCredentials.find(x => x.id === c.id) ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      if (response.ok) {
        const updated = await response.json();
        setJudgeCredentials(
          judgeCredentials.find(x => x.id === c.id)
            ? judgeCredentials.map(x => x.id === c.id ? updated : x)
            : [...judgeCredentials, updated]
        );
        closeModal();
      }
    } catch (error) {
      console.error("Failed to save credential:", error);
    }
  }

  async function saveLinkCredential(c: JudgeCredential) {
    try {
      const response = await fetch("/api/judges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      if (response.ok) {
        const updated = await response.json();
        setJudgeCredentials(
          judgeCredentials.map(x => x.id === c.id ? updated : x)
        );
      }
    } catch (error) {
      console.error("Failed to save link credential:", error);
    }
  }

  async function deleteCredential(id: string) {
    try {
      const response = await fetch(`/api/judges?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        setJudgeCredentials(judgeCredentials.filter(c => c.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete credential:", error);
    }
  }

  async function toggleActive(id: string) {
    const credential = judgeCredentials.find(c => c.id === id);
    if (!credential) return;
    const updated = { ...credential, active: !credential.active };
    try {
      const response = await fetch("/api/judges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        const result = await response.json();
        setJudgeCredentials(judgeCredentials.map(c => c.id === id ? result : c));
      }
    } catch (error) {
      console.error("Failed to toggle active:", error);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleShowPwd(id: string) {
    setShowPwdFor(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const active = judgeCredentials.filter(c => c.active).length;
  const expired = judgeCredentials.filter(c => {
    if (!c.expiresAt) return false;
    const exp = new Date(c.expiresAt); exp.setHours(23,59,59,999);
    return exp < new Date();
  }).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,162,39,0.15)" }}>
              <Scale className="h-5 w-5" style={{ color: "#c9a227" }} />
            </div>
            <h1 className="text-2xl font-bold">Judge Credentials</h1>
          </div>
          <p className="text-sm text-muted ml-12">Create and manage judge logins with expiry dates and access controls</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => { setReportsModalOpen(true); fetchReports(); }}>
            <FileText className="h-4 w-4" /> Reports {reports.length > 0 && `(${reports.length})`}
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Judge
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Judges",  value: judgeCredentials.length, color: "#c9a227" },
          { label: "Active",        value: active,                   color: "#4ade80" },
          { label: "Expired",       value: expired,                  color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search judges by name, username, or competition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">All Credentials</h2>
          <p className="text-xs text-muted">{filteredJudgeCredentials.length} total</p>
        </div>

        {filteredJudgeCredentials.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Scale className="h-10 w-10 mx-auto mb-3 text-muted/40" />
            <p className="text-muted">No judge credentials yet.</p>
            <button onClick={openCreate} className="mt-4 text-sm font-medium" style={{ color: "#c9a227" }}>+ Create first credential</button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredJudgeCredentials.map((cred, i) => {
              const st = expiryStatus(cred.expiresAt, cred.active);
              const pwdVisible = showPwdFor.has(cred.id);
              return (
                <motion.div key={cred.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-black shrink-0"
                      style={{ background: cred.active ? "linear-gradient(135deg, #c9a227, #f5c842)" : "#374151", color: cred.active ? "#000" : "#6b7280" }}>
                      {cred.name.split(" ").filter(w => w !== "Judge").map(w => w[0]).join("").slice(0, 2)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm text-white">{cred.name}</p>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          {st.icon} {st.label}
                        </span>
                      </div>
                      {cred.assignedCompetition && (
                        <p className="text-xs text-muted truncate">
                          {competitions.find(c => c.id === cred.assignedCompetition)?.title || cred.assignedCompetition}
                        </p>
                      )}
                      {cred.notes && (
                        <p className="text-xs mt-0.5 italic truncate" style={{ color: "#4b5563" }}>{cred.notes}</p>
                      )}

                      {/* Credentials row */}
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        {/* Username */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: "#4b5563" }}>User:</span>
                          <code className="text-xs font-mono text-white">{cred.username}</code>
                          <button onClick={() => copyToClipboard(cred.username, `u-${cred.id}`)}
                            className="p-0.5 rounded transition-colors" style={{ color: copied === `u-${cred.id}` ? "#4ade80" : "#4b5563" }}>
                            {copied === `u-${cred.id}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: "#4b5563" }}>Pass:</span>
                          <code className="text-xs font-mono text-white">{pwdVisible ? cred.password : "••••••••"}</code>
                          <button onClick={() => toggleShowPwd(cred.id)}
                            className="p-0.5 rounded transition-colors" style={{ color: "#4b5563" }}>
                            {pwdVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <button onClick={() => copyToClipboard(cred.password, `p-${cred.id}`)}
                            className="p-0.5 rounded transition-colors" style={{ color: copied === `p-${cred.id}` ? "#4ade80" : "#4b5563" }}>
                            {copied === `p-${cred.id}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>

                        {/* Expiry */}
                        {cred.expiresAt && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs" style={{ color: "#4b5563" }}>Expires:</span>
                            <span className="text-xs font-medium" style={{ color: "#9ca3af" }}>{cred.expiresAt}</span>
                          </div>
                        )}

                        {/* Created */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: "#4b5563" }}>Created:</span>
                          <span className="text-xs" style={{ color: "#6b7280" }}>{cred.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Access link */}
                      <button onClick={() => openLink(cred)}
                        title="Access link"
                        className="p-2 rounded-xl transition-all"
                        style={{ background: cred.accessToken ? "rgba(201,162,39,0.1)" : "rgba(255,255,255,0.04)", color: cred.accessToken ? "#f5c842" : "#9ca3af", border: `1px solid ${cred.accessToken ? "rgba(201,162,39,0.25)" : "rgba(255,255,255,0.08)"}` }}>
                        <LinkIcon className="h-4 w-4" />
                      </button>

                      {/* Toggle active */}
                      <button onClick={() => toggleActive(cred.id)}
                        title={cred.active ? "Disable" : "Enable"}
                        className="p-2 rounded-xl transition-all"
                        style={{ background: cred.active ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.08)", color: cred.active ? "#4ade80" : "#ef4444", border: `1px solid ${cred.active ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.2)"}` }}>
                        {cred.active ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                      </button>

                      {/* Edit */}
                      <button onClick={() => openEdit(cred)}
                        className="p-2 rounded-xl transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      {deleteConfirm === cred.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => deleteCredential(cred.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={{ background: "rgba(220,38,38,0.15)", color: "#ef4444", border: "1px solid rgba(220,38,38,0.3)" }}>
                            Confirm
                          </button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="p-2 rounded-xl transition-all"
                            style={{ background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(cred.id)}
                          className="p-2 rounded-xl transition-all"
                          style={{ background: "rgba(220,38,38,0.07)", color: "#ef4444", border: "1px solid rgba(220,38,38,0.15)" }}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mt-5 rounded-2xl px-5 py-4 text-sm text-muted border" style={{ borderColor: "rgba(201,162,39,0.15)", background: "rgba(201,162,39,0.04)" }}>
        <strong className="text-foreground">How it works:</strong> Judges can only enter the portal through the secure access link you generate. Direct access to <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">/judge</code> is blocked. Each link contains a unique token that is validated against the judge’s account. Regenerate or revoke a link at any time.
      </div>

      {/* Credential Modal */}
      <AnimatePresence>
        {modal.open && (
          <CredentialModal initial={modal.editing} onSave={saveCredential} onClose={closeModal} />
        )}
      </AnimatePresence>

      {/* Link Modal */}
      <AnimatePresence>
        {linkModal.open && linkModal.credential && (
          <LinkModal credential={linkModal.credential} onSave={saveLinkCredential} onClose={closeLinkModal} />
        )}
      </AnimatePresence>

      {/* Reports Modal */}
      <AnimatePresence>
        {reportsModalOpen && (
          <ReportsModal
            open={reportsModalOpen}
            reports={reports}
            selectedReport={selectedReport}
            loading={loadingReports}
            onClose={closeReportsModal}
            onSelect={selectReport}
            onBack={backToReports}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
