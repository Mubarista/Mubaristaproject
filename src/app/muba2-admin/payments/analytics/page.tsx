"use client";

import { useState } from "react";
import { useAdminData } from "@/lib/admin-data-context";
import type { PaymentMethod } from "@/types";
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet } from "lucide-react";
import Link from "next/link";

/* ── helpers ────────────────────────────────────────────────────── */
type Period = "daily" | "monthly" | "yearly";

const METHOD_META: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string; bar: string }> = {
  card:          { label: "Visa / Mastercard", icon: <CreditCard className="h-4 w-4" />,  color: "text-blue",   bar: "bg-blue" },
  mobile_money:  { label: "MomoPay",  icon: <Smartphone className="h-4 w-4" />,  color: "text-yellow", bar: "bg-yellow" },
  bank_transfer: { label: "Bank Transfer",     icon: <Building2 className="h-4 w-4" />,   color: "text-green",  bar: "bg-green" },
  paypal:        { label: "PayPal",            icon: <Wallet className="h-4 w-4" />,      color: "text-purple", bar: "bg-purple" },
};

const TYPE_LABELS: Record<string, string> = {
  competition_entry: "Competition Entry",
  premium_subscription: "Premium Sub",
  book_purchase: "Book",
  tool_purchase: "Tool",
  refund: "Refund",
};

function fmt(n: number) {
  return `RWF ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function groupByPeriod(payments: ReturnType<typeof useAdminData>["payments"], period: Period) {
  const completed = payments.filter(p => p.status === "completed" && p.amount > 0);
  const buckets: Record<string, { revenue: number; count: number }> = {};

  completed.forEach(p => {
    const d = new Date(p.createdAt);
    let key: string;
    if (period === "daily")   key = d.toISOString().slice(0, 10);
    else if (period === "monthly") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    else key = String(d.getFullYear());

    if (!buckets[key]) buckets[key] = { revenue: 0, count: 0 };
    buckets[key].revenue += p.amount;
    buckets[key].count++;
  });

  return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]));
}

/* ── component ──────────────────────────────────────────────────── */
export default function PaymentAnalyticsPage() {
  const { payments } = useAdminData();
  const [period, setPeriod] = useState<Period>("monthly");

  const completed = payments.filter(p => p.status === "completed" && p.amount > 0);
  const totalRevenue = completed.reduce((s, p) => s + p.amount, 0);

  /* method breakdown */
  const byMethod = (["card", "mobile_money", "bank_transfer", "paypal"] as PaymentMethod[]).map(m => {
    const rows = completed.filter(p => p.method === m);
    return {
      method: m,
      count: rows.length,
      revenue: rows.reduce((s, p) => s + p.amount, 0),
      pct: totalRevenue > 0 ? (rows.reduce((s, p) => s + p.amount, 0) / totalRevenue) * 100 : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  /* method × type cross-tab */
  const crossTab = (["card", "mobile_money", "bank_transfer", "paypal"] as PaymentMethod[]).map(m => {
    const byType: Record<string, number> = {};
    completed.filter(p => p.method === m).forEach(p => {
      byType[p.type] = (byType[p.type] ?? 0) + p.amount;
    });
    return { method: m, byType };
  });

  /* period time-series */
  const timeSeries = groupByPeriod(payments, period);
  const maxRevenue = Math.max(...timeSeries.map(([, v]) => v.revenue), 1);

  /* method over time (stacked) */
  const methodTimeSeries = (["card", "mobile_money", "bank_transfer", "paypal"] as PaymentMethod[]).map(m => ({
    method: m,
    data: groupByPeriod(payments.filter(p => p.method === m), period),
  }));

  /* top paying users */
  const userTotals: Record<string, { name: string; email: string; country: string; total: number; count: number; methods: Set<string> }> = {};
  completed.forEach(p => {
    if (!userTotals[p.userId]) userTotals[p.userId] = { name: p.userName, email: p.userEmail, country: p.userCountry, total: 0, count: 0, methods: new Set() };
    userTotals[p.userId].total += p.amount;
    userTotals[p.userId].count++;
    userTotals[p.userId].methods.add(p.method);
  });
  const topUsers = Object.values(userTotals).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mbhubteam/payments" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Payment Analytics</h1>
          <p className="text-muted text-sm">Method usage, income trends and top contributors</p>
        </div>
      </div>

      {/* ── Method usage KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {byMethod.map(m => {
          const meta = METHOD_META[m.method];
          return (
            <div key={m.method} className="glass-card rounded-2xl p-5">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${meta.bar}/10 mb-3 ${meta.color}`}>
                {meta.icon}
              </div>
              <p className="text-xl font-bold">{fmt(m.revenue)}</p>
              <p className={`text-sm font-medium mt-0.5 ${meta.color}`}>{meta.label}</p>
              <p className="text-xs text-muted mt-1">{m.count} transactions · {Math.round(m.pct)}% of revenue</p>
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${m.pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Method vs Type cross table ── */}
      <div className="glass-card rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold">Revenue by Method & Category</h2>
          <p className="text-xs text-muted mt-0.5">What each payment method was used to pay for</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-muted-bg/30">
                <th className="text-left px-5 py-3 text-muted text-xs font-medium">Method</th>
                {Object.keys(TYPE_LABELS).map(t => (
                  <th key={t} className="text-right px-4 py-3 text-muted text-xs font-medium whitespace-nowrap">{TYPE_LABELS[t]}</th>
                ))}
                <th className="text-right px-5 py-3 text-muted text-xs font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {crossTab.map(row => {
                const meta = METHOD_META[row.method as PaymentMethod];
                const rowTotal = Object.values(row.byType).reduce((s, v) => s + v, 0);
                return (
                  <tr key={row.method} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-2 font-medium ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    {Object.keys(TYPE_LABELS).map(t => (
                      <td key={t} className="px-4 py-3 text-right text-sm">
                        {row.byType[t] ? fmt(row.byType[t]) : <span className="text-muted/40">—</span>}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-right font-semibold text-green">{rowTotal > 0 ? fmt(rowTotal) : <span className="text-muted/40">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Income time-series ── */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold">Income Over Time</h2>
            <p className="text-xs text-muted mt-0.5">Total completed revenue per {period} period</p>
          </div>
          <div className="flex gap-1">
            {(["daily", "monthly", "yearly"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${period === p ? "bg-blue text-white" : "bg-muted-bg text-muted hover:bg-white/5"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {timeSeries.length === 0 ? (
          <p className="text-center text-muted py-8 text-sm">No completed transactions found</p>
        ) : (
          <div className="space-y-4">
            {/* Bar chart */}
            <div className="flex items-end gap-2 h-40">
              {timeSeries.map(([key, val]) => {
                const pct = (val.revenue / maxRevenue) * 100;
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                    <div className="relative w-full" style={{ height: "120px" }}>
                      <div className="absolute bottom-0 w-full rounded-t-lg bg-blue/20 overflow-hidden transition-all" style={{ height: `${Math.max(pct, 3)}%` }}>
                        <div className="w-full h-full bg-blue rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                        <div className="bg-background border border-white/20 rounded-lg px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                          {fmt(val.revenue)} · {val.count} txn
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted truncate w-full text-center">{key.slice(-5)}</span>
                  </div>
                );
              })}
            </div>

            {/* Summary row */}
            <div className="flex gap-6 pt-3 border-t border-white/10 text-sm">
              <div><span className="text-muted">Periods:</span> <strong>{timeSeries.length}</strong></div>
              <div><span className="text-muted">Total:</span> <strong className="text-green">{fmt(completed.reduce((s, p) => s + p.amount, 0))}</strong></div>
              <div><span className="text-muted">Avg/period:</span> <strong>{fmt(completed.reduce((s, p) => s + p.amount, 0) / Math.max(timeSeries.length, 1))}</strong></div>
              <div><span className="text-muted">Peak:</span> <strong>{fmt(maxRevenue)}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Method share over time (mini bars per method) ── */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <h2 className="font-semibold mb-5">Method Share by Period</h2>
        <div className="space-y-5">
          {methodTimeSeries.filter(m => m.data.length > 0).map(m => {
            const meta = METHOD_META[m.method];
            const total = m.data.reduce((s, [, v]) => s + v.revenue, 0);
            const maxVal = Math.max(...m.data.map(([, v]) => v.revenue), 1);
            return (
              <div key={m.method}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`flex items-center gap-1.5 text-sm font-medium ${meta.color}`}>{meta.icon}{meta.label}</span>
                  <span className="text-xs text-muted ml-auto">{fmt(total)} total · {m.data.reduce((s, [, v]) => s + v.count, 0)} txn</span>
                </div>
                <div className="flex items-end gap-1 h-8">
                  {m.data.map(([key, val]) => (
                    <div key={key} title={`${key}: ${fmt(val.revenue)}`}
                      className={`flex-1 rounded-t-sm ${meta.bar}/60 hover:${meta.bar} transition-all cursor-default`}
                      style={{ height: `${(val.revenue / maxVal) * 100}%`, minHeight: "4px" }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top payers ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold">Top Contributors</h2>
          <p className="text-xs text-muted mt-0.5">Users who have paid the most</p>
        </div>
        <div className="divide-y divide-white/5">
          {topUsers.map((u, i) => (
            <div key={u.email} className="flex items-center gap-4 px-5 py-4">
              <div className="h-8 w-8 rounded-full bg-blue/10 text-blue flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.name}</p>
                <p className="text-xs text-muted truncate">{u.email} · {u.country}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-green">{fmt(u.total)}</p>
                <p className="text-xs text-muted">{u.count} payments · {[...u.methods].map(m => METHOD_META[m as PaymentMethod]?.label ?? m).join(", ")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
