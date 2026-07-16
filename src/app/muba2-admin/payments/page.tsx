"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Payment, Invoice, MonthlyStatement } from "@/types";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  Receipt, FileText, BarChart3, Settings, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<string, string> = {
  competition_entry: "Competition Entries",
  premium_subscription: "Premium Subscriptions",
  book_purchase: "Book Purchases",
  tool_purchase: "Tool Purchases",
  refund: "Refunds",
};

const TYPE_COLORS: Record<string, string> = {
  competition_entry: "text-yellow bg-yellow/10",
  premium_subscription: "text-blue bg-blue/10",
  book_purchase: "text-green bg-green/10",
  tool_purchase: "text-purple bg-purple/10",
  refund: "text-red bg-red/10",
};

const METHOD_ICONS: Record<string, string> = {
  card: "💳",
  mobile_money: "📱",
  bank_transfer: "🏦",
  paypal: "🅿️",
};

function fmt(n: number, currency = "RWF") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-green/10 text-green",
    pending: "bg-yellow/10 text-yellow",
    failed: "bg-red/10 text-red",
    expired: "bg-muted-bg text-muted",
  };
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    expired: <AlertCircle className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-muted-bg text-muted"}`}>
      {icons[status]} {status}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statements, setStatements] = useState<MonthlyStatement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const [paymentsRes, statementsRes, invoicesRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/statements"),
        fetch("/api/invoices"),
      ]);

      if (paymentsRes.ok) setPayments((await paymentsRes.json()) as Payment[]);
      if (statementsRes.ok) setStatements((await statementsRes.json()) as MonthlyStatement[]);
      if (invoicesRes.ok) setInvoices((await invoicesRes.json()) as Invoice[]);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearAll() {
    if (!confirm("Are you sure you want to clear all transactions? This cannot be undone.")) return;
    try {
      const response = await fetch("/api/payments?clear=all", { method: "DELETE" });
      if (response.ok) {
        await fetchData();
      } else {
        console.error("Failed to clear transactions");
      }
    } catch (error) {
      console.error("Error clearing transactions:", error);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  const completed = payments.filter(p => p.status === "completed");
  const pending = payments.filter(p => p.status === "pending");
  const refunds = payments.filter(p => p.type === "refund");

  const baseCurrency = completed[0]?.currency || "RWF";

  const totalRevenue = completed.filter(p => p.type !== "refund").reduce((s, p) => s + (p.amount || 0), 0);
  const totalRefunds = Math.abs(refunds.reduce((s, p) => s + (p.amount || 0), 0));
  const netRevenue = totalRevenue - totalRefunds;
  const pendingAmount = pending.reduce((s, p) => s + (p.amount || 0), 0);

  const latestStatement = statements && statements.length > 0 ? statements[statements.length - 1] : null;

  // Revenue by type
  const byType = completed
    .filter(p => p.type !== "refund")
    .reduce<Record<string, number>>((acc, p) => {
      const type = p.type || 'other';
      acc[type] = (acc[type] ?? 0) + (p.amount || 0);
      return acc;
    }, {});

  const recent = [...payments]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 6);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payment Center</h1>
        <p className="text-muted text-sm">Income overview, transactions, invoices and monthly statements.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Net Revenue", value: fmt(netRevenue, baseCurrency), icon: DollarSign, color: "text-green", bg: "bg-green/10", sub: `${completed.length} successful payments` },
          { label: "Total Collected", value: fmt(totalRevenue, baseCurrency), icon: TrendingUp, color: "text-blue", bg: "bg-blue/10", sub: `Excl. refunds` },
          { label: "Pending", value: fmt(pendingAmount, baseCurrency), icon: Clock, color: "text-yellow", bg: "bg-yellow/10", sub: `${pending.length} transactions` },
          { label: "Refunded", value: fmt(totalRefunds, baseCurrency), icon: TrendingDown, color: "text-red", bg: "bg-red/10", sub: `${refunds.length} refund(s)` },
        ].map(card => (
          <div key={card.label} className="glass-card rounded-2xl p-5">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.bg} mb-3`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted mt-0.5">{card.label}</p>
            <p className="text-xs text-muted/60 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue by type */}
        <div className="glass-card rounded-2xl p-5 lg:col-span-1">
          <h2 className="font-semibold mb-4">Revenue by Type</h2>
          <div className="space-y-3">
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, amount]) => {
              const pct = Math.round((amount / totalRevenue) * 100);
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[type]}`}>{TYPE_LABELS[type]}</span>
                    <span className="text-sm font-semibold">{fmt(amount, baseCurrency)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-blue rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly trend */}
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Monthly Net Revenue</h2>
          {statements && statements.length > 0 ? (
            <>
              <div className="flex items-end gap-3 h-32">
                {statements.map(s => {
                  const maxNet = Math.max(...statements.map(x => x.netBalance || 0));
                  const pct = maxNet > 0 ? ((s.netBalance || 0) / maxNet) * 100 : 0;
                  return (
                    <div key={`${s.period || s.id}`} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-muted">{fmt(s.netBalance || 0, s.currency || baseCurrency)}</span>
                      <div className="w-full rounded-t-lg bg-blue/20 relative overflow-hidden" style={{ height: `${Math.max(pct, 8)}%` }}>
                        <div className="absolute inset-x-0 bottom-0 bg-blue rounded-t-lg" style={{ height: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted">{s.period ? s.period.slice(0, 3) : 'N/A'}</span>
                    </div>
                  );
                })}
              </div>
              {latestStatement && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted">
                  <span>Latest: <strong className="text-foreground">{latestStatement.period || 'N/A'}</strong></span>
                  <span>{fmt(latestStatement.netBalance || 0, latestStatement.currency || baseCurrency)} net</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted text-sm">
              No statement data available yet
            </div>
          )}
        </div>
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { href: "/muba2-admin/payments/transactions", icon: CreditCard, label: "All Transactions", desc: `${payments.length} total`, color: "text-blue bg-blue/10" },
          { href: "/muba2-admin/payments/invoices", icon: Receipt, label: "Invoices", desc: `${invoices.length} invoices`, color: "text-green bg-green/10" },
          { href: "/muba2-admin/payments/statements", icon: FileText, label: "Statements", desc: `${statements.length} months`, color: "text-yellow bg-yellow/10" },
          { href: "/muba2-admin/payments/analytics", icon: BarChart3, label: "Analytics", desc: "Methods & trends", color: "text-purple bg-purple/10" },
          { href: "/muba2-admin/payments/settings", icon: Settings, label: "Payment Method", desc: "Configure payment methods", color: "text-muted bg-muted-bg" },
        ].map(nav => (
          <Link key={nav.href} href={nav.href} className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:bg-white/5 transition-colors group">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${nav.color}`}>
              <nav.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{nav.label}</p>
              <p className="text-xs text-muted">{nav.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold">Recent Transactions</h2>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red hover:text-red hover:bg-red/10 h-8 px-2">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
            </Button>
            <Link href="/muba2-admin/payments/transactions" className="text-xs text-blue hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-muted font-medium text-xs">User</th>
                <th className="text-left px-5 py-3 text-muted font-medium text-xs">Description</th>
                <th className="text-left px-5 py-3 text-muted font-medium text-xs">Method</th>
                <th className="text-left px-5 py-3 text-muted font-medium text-xs">Amount</th>
                <th className="text-left px-5 py-3 text-muted font-medium text-xs">Status</th>
                <th className="text-left px-5 py-3 text-muted font-medium text-xs">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-sm">{p.userName || 'Unknown User'}</p>
                    <p className="text-xs text-muted">{p.userCountry || 'N/A'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm">{p.description || 'No description'}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLORS[p.type] || 'bg-muted-bg text-muted'}`}>{TYPE_LABELS[p.type] || p.type}</span>
                  </td>
                  <td className="px-5 py-3 text-sm">{METHOD_ICONS[p.method]} {p.method ? p.method.replace("_", " ") : 'N/A'}</td>
                  <td className="px-5 py-3 font-semibold text-sm">
                    <span className={p.amount < 0 ? "text-red" : "text-green"}>{p.amount < 0 ? "-" : "+"}{fmt(p.amount || 0, p.currency || baseCurrency)}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={p.status || 'pending'} /></td>
                  <td className="px-5 py-3 text-xs text-muted">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
