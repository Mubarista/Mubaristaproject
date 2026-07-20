"use client";

import { useState } from "react";
import { useAdminData } from "@/lib/admin-data-context";
import type { PaymentStatus, PaymentType } from "@/types";
import { Search, Filter, ArrowLeft, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const TYPE_LABELS: Record<PaymentType, string> = {
  competition_entry: "Competition Entry",
  premium_subscription: "Premium Sub",
  book_purchase: "Book",
  tool_purchase: "Tool",
  job_access: "Job Access",
  refund: "Refund",
};

const TYPE_COLORS: Record<PaymentType, string> = {
  competition_entry: "text-yellow bg-yellow/10",
  premium_subscription: "text-blue bg-blue/10",
  book_purchase: "text-green bg-green/10",
  tool_purchase: "text-purple bg-purple/10",
  job_access: "text-orange bg-orange/10",
  refund: "text-red bg-red/10",
};

const METHOD_ICONS: Record<string, string> = { card: "💳", mobile_money: "📱", bank_transfer: "🏦", paypal: "🅿️" };

function fmt(n: number, currency = "RWF") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

export default function TransactionsPage() {
  const { payments, setPayments } = useAdminData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortField, setSortField] = useState<"createdAt" | "amount">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  const filtered = payments
    .filter(p => {
      const q = search.toLowerCase();
      if (q && !p.userName.toLowerCase().includes(q) && !p.userEmail.toLowerCase().includes(q) && !p.reference.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterType !== "all" && p.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      let av: number, bv: number;
      if (sortField === "amount") { av = Math.abs(a.amount); bv = Math.abs(b.amount); }
      else { av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); }
      return sortDir === "desc" ? bv - av : av - bv;
    });

  async function handleClearAll() {
    setClearing(true);
    try {
      const response = await fetch("/api/payments?clear=all", { method: "DELETE" });
      if (response.ok) {
        setPayments([]);
        setShowClearDialog(false);
      } else {
        console.error("Failed to clear transactions");
      }
    } catch (error) {
      console.error("Error clearing transactions:", error);
    } finally {
      setClearing(false);
    }
  }

  async function saveNote(id: string) {
    const response = await fetch("/api/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes: noteValue }),
    });
    if (response.ok) {
      setPayments(payments.map(p => p.id === id ? { ...p, notes: noteValue } : p));
    } else {
      console.error("Failed to save note");
    }
    setEditingNote(null);
  }

  async function updateStatus(id: string, newStatus: PaymentStatus) {
    const response = await fetch("/api/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (response.ok) {
      const updated = await response.json();
      setPayments(payments.map(p => (p.id === id ? updated : p)));
    } else {
      console.error("Failed to update status");
    }
  }

  function toggleSort(field: "createdAt" | "amount") {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const completedPayments = filtered.filter(p => p.status === "completed");
  const totalFiltered = completedPayments.reduce((s, p) => s + p.amount, 0);
  const displayCurrency = completedPayments[0]?.currency || "RWF";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/muba2-admin/payments" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">All Transactions</h1>
            <p className="text-muted text-sm">{filtered.length} records · {fmt(totalFiltered, displayCurrency)} completed revenue in view</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowClearDialog(true)} className="text-red hover:text-red hover:bg-red/10 h-8 px-2">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, reference…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted-bg border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-muted-bg border border-white/10 text-sm focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="expired">Expired</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-xl bg-muted-bg border border-white/10 text-sm focus:outline-none">
          <option value="all">All Types</option>
          <option value="competition_entry">Competition Entry</option>
          <option value="premium_subscription">Premium Subscription</option>
          <option value="book_purchase">Book Purchase</option>
          <option value="tool_purchase">Tool Purchase</option>
          <option value="refund">Refund</option>
        </select>
        <button onClick={() => toggleSort("createdAt")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-colors ${sortField === "createdAt" ? "border-blue/40 bg-blue/10 text-blue" : "border-white/10 bg-muted-bg text-muted hover:border-blue/30"}`}>
          <SlidersHorizontal className="h-3 w-3" /> Date {sortField === "createdAt" ? (sortDir === "desc" ? "↓" : "↑") : ""}
        </button>
        <button onClick={() => toggleSort("amount")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-colors ${sortField === "amount" ? "border-blue/40 bg-blue/10 text-blue" : "border-white/10 bg-muted-bg text-muted hover:border-blue/30"}`}>
          <Filter className="h-3 w-3" /> Amount {sortField === "amount" ? (sortDir === "desc" ? "↓" : "↑") : ""}
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["User", "Description", "Method", "Amount", "Status", "Reference", "Date", "Notes"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted">No transactions found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium">{p.userName}</p>
                    <p className="text-xs text-muted">{p.userEmail}</p>
                    <p className="text-xs text-muted/60">{p.userCountry}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p>{p.description}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLORS[p.type]}`}>{TYPE_LABELS[p.type]}</span>
                    {p.competitionTitle && <p className="text-xs text-muted mt-0.5">🏆 {p.competitionTitle}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{METHOD_ICONS[p.method]} {p.method.replace("_", " ")}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold">
                    <span className={p.amount < 0 ? "text-red" : "text-green"}>{p.amount < 0 ? "−" : "+"}{fmt(p.amount, p.currency)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={p.status}
                      onChange={e => updateStatus(p.id, e.target.value as PaymentStatus)}
                      className="bg-muted-bg border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="expired">Expired</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">{p.reference}</td>
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    <p>{new Date(p.createdAt).toLocaleDateString()}</p>
                    {p.paidAt && <p className="text-green/70">Paid {new Date(p.paidAt).toLocaleDateString()}</p>}
                  </td>
                  <td className="px-4 py-3 min-w-32">
                    {editingNote === p.id ? (
                      <div className="flex flex-col gap-1">
                        <input autoFocus value={noteValue} onChange={e => setNoteValue(e.target.value)} className="w-full rounded-lg bg-muted-bg border border-white/10 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue" />
                        <div className="flex gap-1">
                          <button onClick={() => saveNote(p.id)} className="px-2 py-0.5 rounded-lg bg-blue text-white text-xs">Save</button>
                          <button onClick={() => setEditingNote(null)} className="px-2 py-0.5 rounded-lg bg-muted-bg text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingNote(p.id); setNoteValue(p.notes ?? ""); }} className="text-xs text-muted hover:text-foreground transition-colors text-left">
                        {p.notes ? <span className="text-foreground">{p.notes}</span> : <span className="italic">+ add note</span>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showClearDialog && (
        <ConfirmDialog
          title="Clear all transactions"
          message={
            <>
              You are about to permanently delete every payment transaction from the system.
              <br /><br />
              This action cannot be undone.
            </>
          }
          confirmLabel="Clear all"
          onConfirm={handleClearAll}
          onCancel={() => setShowClearDialog(false)}
          isLoading={clearing}
        />
      )}
    </div>
  );
}
