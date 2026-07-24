"use client";

import { useState } from "react";
import { useAdminData } from "@/lib/admin-data-context";
import type { Invoice, InvoiceStatus } from "@/types";
import { ArrowLeft, X, CheckCircle, Clock, AlertCircle, XCircle, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

function fmt(n: number) {
  return `RWF ${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

const STATUS_CFG: Record<InvoiceStatus, { cls: string; icon: React.ReactNode }> = {
  paid:      { cls: "bg-green/10 text-green", icon: <CheckCircle className="h-3 w-3" /> },
  pending:   { cls: "bg-yellow/10 text-yellow", icon: <Clock className="h-3 w-3" /> },
  overdue:   { cls: "bg-red/10 text-red", icon: <AlertCircle className="h-3 w-3" /> },
  cancelled: { cls: "bg-muted-bg text-muted", icon: <XCircle className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
      {c.icon} {status}
    </span>
  );
}

function InvoiceModal({ invoice, onClose, onStatusChange }: { invoice: Invoice; onClose: () => void; onStatusChange: (id: string, s: InvoiceStatus) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl glass-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="font-bold text-lg">{invoice.invoiceNumber}</h3>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted-bg border border-white/10 text-xs hover:bg-white/5 transition-colors">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Parties */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest mb-1">From</p>
              <p className="font-bold">MUBARISTA</p>
              <p className="text-sm text-muted">mubarista@platform.com</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-widest mb-1">Billed To</p>
              <p className="font-bold">{invoice.userName}</p>
              <p className="text-sm text-muted">{invoice.userEmail}</p>
              <p className="text-sm text-muted">{invoice.userCountry}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted">Issued:</span> {invoice.issuedAt}</div>
            <div><span className="text-muted">Due:</span> {invoice.dueAt}</div>
            {invoice.paidAt && <div><span className="text-muted">Paid:</span> <span className="text-green">{invoice.paidAt}</span></div>}
          </div>

          {/* Items */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-muted-bg">
                  <th className="text-left px-4 py-2 text-muted text-xs">Description</th>
                  <th className="text-right px-4 py-2 text-muted text-xs">Qty</th>
                  <th className="text-right px-4 py-2 text-muted text-xs">Unit</th>
                  <th className="text-right px-4 py-2 text-muted text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{fmt(item.amount)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(item.amount * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td colSpan={3} className="px-4 py-2 text-right text-muted text-sm">Subtotal</td>
                  <td className="px-4 py-2 text-right">{fmt(invoice.subtotal)}</td>
                </tr>
                {invoice.tax > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-muted text-sm">Tax</td>
                    <td className="px-4 py-2 text-right">{fmt(invoice.tax)}</td>
                  </tr>
                )}
                <tr className="bg-muted-bg">
                  <td colSpan={3} className="px-4 py-3 text-right font-bold">Total ({invoice.currency})</td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-green">{fmt(invoice.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Status change */}
          {invoice.status !== "paid" && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-muted">Mark as:</span>
              {(["paid", "overdue", "cancelled"] as InvoiceStatus[]).map(s => (
                <button key={s} onClick={() => { onStatusChange(invoice.id, s); onClose(); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${STATUS_CFG[s].cls} border-current hover:opacity-80`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const { invoices, setInvoices } = useAdminData();
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  const filtered = invoices.filter(inv => filterStatus === "all" || inv.status === filterStatus);

  async function handleClearAll() {
    setClearing(true);
    try {
      const response = await fetch("/api/invoices?clear=all", { method: "DELETE" });
      if (response.ok) {
        setInvoices([]);
      } else {
        console.error("Failed to clear invoices");
      }
    } catch (error) {
      console.error("Error clearing invoices:", error);
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
  }

  function changeStatus(id: string, status: InvoiceStatus) {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status, paidAt: status === "paid" ? new Date().toISOString().slice(0, 10) : inv.paidAt } : inv));
  }

  const totals = {
    paid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0),
    pending: invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.total, 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0),
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mbhubteam/payments" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted text-sm">{invoices.length} total invoices</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Paid", value: fmt(totals.paid), cls: "text-green", n: invoices.filter(i => i.status === "paid").length },
          { label: "Pending", value: fmt(totals.pending), cls: "text-yellow", n: invoices.filter(i => i.status === "pending").length },
          { label: "Overdue", value: fmt(totals.overdue), cls: "text-red", n: invoices.filter(i => i.status === "overdue").length },
        ].map(c => (
          <div key={c.label} className="glass-card rounded-2xl p-4 text-center">
            <p className={`text-xl font-bold ${c.cls}`}>{c.value}</p>
            <p className="text-sm text-muted">{c.label} ({c.n})</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {["all", "paid", "pending", "overdue", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${filterStatus === s ? "bg-blue text-white" : "bg-muted-bg text-muted hover:bg-white/5"}`}>
            {s}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setShowClearDialog(true)} className="ml-auto text-red hover:text-red hover:bg-red/10 h-8 px-2">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
        </Button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Invoice #", "Customer", "Items", "Total", "Status", "Issued", "Due", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted">No invoices found</td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{inv.userName}</p>
                    <p className="text-xs text-muted">{inv.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{inv.items.length} item(s)</td>
                  <td className="px-4 py-3 font-semibold text-green">{fmt(inv.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted">{inv.issuedAt}</td>
                  <td className="px-4 py-3 text-xs text-muted">{inv.dueAt}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewing(inv)} className="px-3 py-1.5 rounded-xl bg-muted-bg border border-white/10 text-xs hover:bg-blue/10 hover:border-blue/30 transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && <InvoiceModal invoice={viewing} onClose={() => setViewing(null)} onStatusChange={changeStatus} />}

      {showClearDialog && (
        <ConfirmDialog
          title="Clear all invoices"
          message={
            <>
              You are about to permanently delete all invoices from the system.
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
