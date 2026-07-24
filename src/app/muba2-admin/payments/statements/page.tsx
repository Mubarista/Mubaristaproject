"use client";

import { useState, useEffect } from "react";
import { useAdminData } from "@/lib/admin-data-context";
import type { MonthlyStatement, PaymentType } from "@/types";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import Link from "next/link";

const TYPE_LABELS: Record<PaymentType, string> = {
  competition_entry: "Competition Entries",
  premium_subscription: "Premium Subscriptions",
  book_purchase: "Book Purchases",
  tool_purchase: "Tool Purchases",
  job_access: "Job Access",
  refund: "Refunds",
};

const TYPE_COLORS: Record<PaymentType, string> = {
  competition_entry: "bg-yellow text-yellow",
  premium_subscription: "bg-blue text-blue",
  book_purchase: "bg-green text-green",
  tool_purchase: "bg-purple text-purple",
  job_access: "bg-orange text-orange",
  refund: "bg-red text-red",
};

function fmt(n: number) {
  return `RWF ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function StatementCard({ s, selected, onClick }: { s: MonthlyStatement; selected: boolean; onClick: () => void }) {
  const netRevenue = s.netRevenue ?? 0;
  const month = s.month ?? "";
  const year = s.year ?? 0;
  const transactionCount = s.transactionCount ?? 0;
  const growth = netRevenue > 0;
  return (
    <button onClick={onClick} className={`w-full text-left glass-card rounded-2xl p-5 border-2 transition-all ${selected ? "border-blue" : "border-transparent hover:border-white/10"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold">{month} {year}</p>
        {growth ? <TrendingUp className="h-4 w-4 text-green" /> : <TrendingDown className="h-4 w-4 text-red" />}
      </div>
      <p className="text-2xl font-bold text-green">{fmt(netRevenue)}</p>
      <p className="text-xs text-muted mt-1">{transactionCount} transactions</p>
      <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-blue rounded-full" style={{ width: `${Math.min((netRevenue / 2000) * 100, 100)}%` }} />
      </div>
    </button>
  );
}

export default function StatementsPage() {
  const { statements } = useAdminData();
  const [selected, setSelected] = useState<MonthlyStatement | null>(null);

  useEffect(() => {
    if (!selected && statements.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(statements[statements.length - 1]);
    }
  }, [statements, selected]);

  const maxRevenue = Math.max(...statements.map(s => s.netRevenue ?? 0));
  const totalAllTime = statements.reduce((sum, s) => sum + (s.netRevenue ?? 0), 0);
  const totalTransactions = statements.reduce((sum, s) => sum + (s.transactionCount ?? 0), 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mbhubteam/payments" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Monthly Statements</h1>
          <p className="text-muted text-sm">All-time net revenue: <strong className="text-green">{fmt(totalAllTime)}</strong> · {totalTransactions} transactions</p>
        </div>
      </div>

      {/* Statement selector cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statements.map(s => (
          <StatementCard key={`${s.month ?? s.period}-${s.year ?? 0}`} s={s} selected={selected?.month === s.month && selected?.year === s.year} onClick={() => setSelected(s)} />
        ))}
      </div>

      {/* Selected statement detail */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financials */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-5 w-5 text-blue" />
              <h2 className="font-semibold">{selected?.month ?? selected?.period} {selected?.year} — Summary</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "Gross Revenue", value: fmt(selected?.totalRevenue ?? 0), cls: "text-green", icon: <TrendingUp className="h-4 w-4 text-green" /> },
                { label: "Total Refunds", value: fmt(selected?.totalRefunds ?? 0), cls: "text-red", icon: <TrendingDown className="h-4 w-4 text-red" /> },
                { label: "Net Revenue", value: fmt(selected?.netRevenue ?? 0), cls: "text-blue font-bold text-lg", icon: null },
                { label: "Transactions", value: String(selected?.transactionCount ?? 0), cls: "text-foreground", icon: null },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    {row.icon}
                    <span className="text-sm text-muted">{row.label}</span>
                  </div>
                  <span className={`font-semibold ${row.cls}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue breakdown chart */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold mb-5">Revenue Breakdown</h2>
            <div className="space-y-3">
              {(Object.entries(selected?.byType ?? {}) as [PaymentType, number][])
                .filter(([, v]) => v !== 0)
                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                .map(([type, amount]) => {
                  const pct = (selected?.totalRevenue ?? 0) > 0 ? Math.round((Math.abs(amount) / (selected?.totalRevenue ?? 0)) * 100) : 0;
                  const colorClass = TYPE_COLORS[type];
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted">{TYPE_LABELS[type]}</span>
                        <span className={`text-sm font-semibold ${amount < 0 ? "text-red" : "text-foreground"}`}>
                          {amount < 0 ? "−" : ""}{fmt(amount)} <span className="text-muted text-xs font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colorClass.split(" ")[0]}/60`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* All months comparison bar chart */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <h2 className="font-semibold mb-5">Net Revenue Comparison</h2>
        <div className="flex items-end gap-4 h-40">
          {statements.map(s => {
            const netRevenue = s.netRevenue ?? 0;
            const pct = maxRevenue > 0 ? (netRevenue / maxRevenue) * 100 : 0;
            const isSelected = s.month === selected?.month && s.year === selected?.year;
            return (
              <div key={`${s.month ?? s.period}-${s.year ?? 0}`} className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setSelected(s)}>
                <span className="text-xs text-muted">{fmt(netRevenue)}</span>
                <div className="w-full rounded-t-xl overflow-hidden bg-white/5" style={{ height: `${Math.max(pct, 5)}%` }}>
                  <div className={`w-full h-full rounded-t-xl transition-all ${isSelected ? "bg-blue" : "bg-blue/30 hover:bg-blue/50"}`} />
                </div>
                <span className={`text-xs font-medium ${isSelected ? "text-blue" : "text-muted"}`}>{(s.month ?? "N/A").slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
