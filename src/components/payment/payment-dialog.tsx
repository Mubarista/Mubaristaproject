"use client";

import { useState } from "react";
import {
  X, Smartphone, CheckCircle2, XCircle, Loader2,
  Lock, ShieldCheck, ChevronRight, ArrowLeft,
} from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAdminData } from "@/lib/admin-data-context";
import { useAuth } from "@/lib/auth-context";
import { useCurrency, fmtCurrency } from "@/lib/use-currency";
import { createPayment } from "@/lib/payment";
import { validatePhoneNumber } from "@/lib/phone-utils";
import type { PaymentType } from "@/types";
import { MtnMomoIcon } from "@/components/icons/mtn-momo";
import { VisaIcon } from "@/components/icons/visa";
import { MastercardIcon } from "@/components/icons/mastercard";

export type PaymentMethod = "mtn_momo" | "card" | "paypal";

export interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  /** Base amount always in USD — conversion to RWF is automatic */
  amount: number;
  description: string;
  userCountry?: string;
  paymentType?: PaymentType;
  reference?: string;
  onSuccess?: (method: PaymentMethod, ref: string) => void;
}

type Step = "method" | "form" | "processing" | "success" | "failed";

function generateRef() {
  return "REF-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

/* ─── Method card ──────────────────────────────────────────────── */
function MethodCard({
  selected, onClick, logo, name, sub, badge,
}: {
  selected: boolean;
  onClick: () => void;
  logo: React.ReactNode;
  name: string;
  sub: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all text-left ${
        selected
          ? "border-blue bg-blue/10"
          : "border-white/10 bg-muted-bg hover:border-blue/40 hover:bg-white/5"
      }`}
    >
      <div className="shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-background">
        {logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{name}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
      {badge && (
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green/10 text-green font-medium">
          {badge}
        </span>
      )}
      {selected && <ChevronRight className="h-4 w-4 text-blue shrink-0" />}
    </button>
  );
}

/* ─── MomoPay logo ────────────────────────────────────────────── */
function MomoLogo() {
  return <MtnMomoIcon className="h-8 w-12" />;
}

/* ─── Visa / Mastercard logos ──────────────────────────────────── */
function CardLogos() {
  return (
    <div className="flex items-center gap-1">
      <VisaIcon className="h-6 w-9" />
      <MastercardIcon className="h-6 w-9" />
    </div>
  );
}

/* ─── PayPal logo ──────────────────────────────────────────────── */
function PayPalLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
      <rect width="48" height="48" rx="10" fill="#003087" />
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">PayPal</text>
    </svg>
  );
}

/* ─── Card form ────────────────────────────────────────────────── */
function CardForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent) => void; loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-muted mb-1 block">Cardholder Name</label>
        <input required placeholder="Iraguha Mugisha" className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
      </div>
      <div>
        <label className="text-xs text-muted mb-1 block">Card Number</label>
        <div className="relative">
          <input required placeholder="1234 5678 9012 3456" maxLength={19} className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue pr-24"
            onChange={e => { e.target.value = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim(); }} />
          <div className="absolute right-3 top-1/2 -translate-y-1/2"><CardLogos /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted mb-1 block">Expiry (MM/YY)</label>
          <input required placeholder="MM/YY" maxLength={5} className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
            onChange={e => {
              let v = e.target.value.replace(/\D/g, "");
              if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
              e.target.value = v;
            }} />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">CVC</label>
          <div className="relative">
            <input required placeholder="•••" maxLength={4} type="password" className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue pr-10" />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          </div>
        </div>
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <>Pay Now <ShieldCheck className="h-4 w-4 ml-1" /></>}
      </Button>
    </form>
  );
}

/* ─── MoMo form ────────────────────────────────────────────────── */
function MomoForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent) => void; loading: boolean }) {
  const [momoPhone, setMomoPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validatePhoneNumber(momoPhone);
    if (!validation.valid) {
      setPhoneError(validation.error || "Enter a valid phone number");
      return;
    }
    setPhoneError(null);
    onSubmit(e);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-yellow/5 border border-yellow/20 p-4 flex items-start gap-3">
        <MomoLogo />
        <div>
          <p className="text-sm font-semibold text-yellow">MomoPay</p>
          <p className="text-xs text-muted mt-0.5">A USSD prompt will be sent to your phone to confirm the payment.</p>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted mb-1 block">MomoPay Phone Number</label>
        <PhoneInput
          value={momoPhone}
          onChange={(value) => {
            setMomoPhone(value);
            setPhoneError(null);
          }}
          placeholder="788 000 000"
          required
          className="w-full"
        />
        {phoneError && (
          <p className="text-xs text-red mt-1">{phoneError}</p>
        )}
        <p className="text-xs text-muted mt-1">Enter your number with the country code (e.g. +250 788 000 000)</p>
      </div>
      <div>
        <label className="text-xs text-muted mb-1 block">Account Name</label>
        <input required placeholder="Iraguha Mugisha" className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending prompt…</> : <>Send MomoPay Prompt <Smartphone className="h-4 w-4 ml-1" /></>}
      </Button>
    </form>
  );
}

/* ─── PayPal form ──────────────────────────────────────────────── */
function PayPalForm({ onSubmit, loading }: { onSubmit: (e: React.FormEvent) => void; loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-2xl bg-blue/5 border border-blue/20 p-4 text-center">
        <PayPalLogo />
        <p className="text-sm mt-3 text-muted">You will be redirected to PayPal to complete your payment securely.</p>
      </div>
      <div>
        <label className="text-xs text-muted mb-1 block">PayPal Email</label>
        <input required type="email" placeholder="iraguha.mugisha@paypal.com" className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</> : <>Continue to PayPal</>}
      </Button>
    </form>
  );
}

/* ─── Main dialog ──────────────────────────────────────────────── */
export function PaymentDialog({
  open, onClose, amount, description, userCountry = "", paymentType = "competition_entry", reference, onSuccess,
}: PaymentDialogProps) {
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState("");
  const { paymentSettings } = useAdminData();
  const { user } = useAuth();
  const resolved = useCurrency(amount, paymentType);

  const isRwandan = resolved.isRwandan || userCountry.toLowerCase().includes("rwanda") || userCountry === "RW";

  // Find admin-configured rules for this payment context
  const contextSettings = paymentSettings.find(s => s.context === paymentType);

  // Build allowed method ids from admin settings, filtered by region
  const adminAllowed = new Set<string>(
    contextSettings?.methods
      .filter(r => {
        if (!r.enabled) return false;
        if (r.regions === "rwanda_only" && !isRwandan) return false;
        if (r.regions === "international_only" && isRwandan) return false;
        return true;
      })
      .map(r => r.method) ?? ["card", "mobile_money", "paypal"]
  );

  const ALL_METHODS: { id: PaymentMethod; name: string; sub: string; logo: React.ReactNode; badge?: string; adminKey: string }[] = [
    { id: "mtn_momo" as PaymentMethod, adminKey: "mobile_money", name: "MomoPay", sub: "Pay via MomoPay USSD prompt (Rwanda only)", logo: <MomoLogo />, badge: "Rwanda" },
    { id: "card" as PaymentMethod,     adminKey: "card",         name: "Visa / Mastercard", sub: "Credit or debit card — accepted worldwide", logo: <CardLogos /> },
    { id: "paypal" as PaymentMethod,   adminKey: "paypal",       name: "PayPal", sub: "International payments via PayPal", logo: <PayPalLogo /> },
  ];

  const methods = ALL_METHODS.filter(m => adminAllowed.has(m.adminKey));

  function reset() {
    setStep("method");
    setMethod(null);
    setLoading(false);
    setRef("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function proceedToForm() {
    if (method) setStep("form");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStep("processing");
    const newRef = reference || generateRef();
    setRef(newRef);
    setTimeout(async () => {
      setLoading(false);
      setStep("success");

      // Record the completed transaction for the admin payments center
      await createPayment({
        userId: user?.id,
        userName: user?.name || "Guest",
        userEmail: user?.email || "",
        userCountry: user?.country || userCountry,
        type: paymentType,
        description,
        amount: resolved.amount,
        currency: resolved.currency,
        method: method || undefined,
        reference: newRef,
        status: "completed",
      });

      onSuccess?.(method!, newRef);
    }, 2800);
  }

  function fmt(n: number, cur: "USD" | "RWF" = resolved.currency) {
    return fmtCurrency(n, cur);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step === "form" && (
              <button type="button" onClick={() => setStep("method")} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="font-bold text-base">
                {step === "method" && "Choose Payment Method"}
                {step === "form" && (method === "mtn_momo" ? "MomoPay" : method === "card" ? "Card Payment" : "PayPal")}
                {step === "processing" && "Processing Payment"}
                {step === "success" && "Payment Successful"}
                {step === "failed" && "Payment Failed"}
              </h2>
              {(step === "method" || step === "form") && (
                <p className="text-xs text-muted mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button type="button" onClick={handleClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount badge */}
        {(step === "method" || step === "form") && (
          <div className="mx-6 mt-5 rounded-2xl bg-blue/10 border border-blue/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Total due</span>
              <span className="text-xl font-bold text-blue">{fmt(resolved.amount)}</span>
            </div>
            {resolved.bothAccepted && resolved.altCurrency && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted/70">Also accepted</span>
                <span className="text-xs text-muted font-medium">{fmt(resolved.altAmount!, resolved.altCurrency)}</span>
              </div>
            )}
          </div>
        )}

        <div className="px-6 py-5">
          {/* ── STEP: method ── */}
          {step === "method" && (
            <div className="space-y-3">
              <p className="text-xs text-muted mb-1">
                {isRwandan ? "Available for your region (Rwanda)" : "Available payment methods"}
              </p>
              {methods.map(m => (
                <MethodCard
                  key={m.id}
                  selected={method === m.id}
                  onClick={() => setMethod(m.id)}
                  logo={m.logo}
                  name={m.name}
                  sub={m.sub}
                  badge={m.badge}
                />
              ))}
              <Button
                variant="primary"
                className="w-full mt-4"
                disabled={!method}
                onClick={proceedToForm}
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ShieldCheck className="h-3.5 w-3.5 text-muted" />
                <span className="text-xs text-muted">256-bit SSL encrypted · Secure payment</span>
              </div>
            </div>
          )}

          {/* ── STEP: form ── */}
          {step === "form" && method === "mtn_momo" && <MomoForm onSubmit={handleSubmit} loading={loading} />}
          {step === "form" && method === "card" && <CardForm onSubmit={handleSubmit} loading={loading} />}
          {step === "form" && method === "paypal" && <PayPalForm onSubmit={handleSubmit} loading={loading} />}

          {/* ── STEP: processing ── */}
          {step === "processing" && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-blue/10 flex items-center justify-center">
                <LoadingDots />
              </div>
              <div>
                <p className="font-semibold">
                  {method === "mtn_momo" ? "Sending USSD prompt to your phone…" : method === "paypal" ? "Connecting to PayPal…" : "Authorising your card…"}
                </p>
                <p className="text-xs text-muted mt-1">Please do not close this window</p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                <div className="h-full bg-blue rounded-full animate-[progress_2.8s_ease-in-out_forwards]" style={{ width: "0%" }} />
              </div>
            </div>
          )}

          {/* ── STEP: success ── */}
          {step === "success" && (
            <div className="py-6 flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-green/10 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green" />
              </div>
              <div>
                <p className="font-bold text-lg text-green">Payment Complete!</p>
                <p className="text-sm text-muted mt-1">{description}</p>
                <p className="text-xs text-muted mt-1">
                  {method === "mtn_momo" ? "Paid via MomoPay" : method === "card" ? "Paid via Card" : "Paid via PayPal"}
                </p>
              </div>
              <div className="w-full rounded-2xl bg-muted-bg border border-white/10 px-4 py-3 text-left space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Amount paid</span>
                  <span className="font-bold text-green">{fmt(resolved.amount)}</span>
                </div>
                {resolved.bothAccepted && resolved.altCurrency && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Equivalent</span>
                    <span className="text-muted">{fmt(resolved.altAmount!, resolved.altCurrency)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Reference</span>
                  <span className="font-mono text-blue">{ref}</span>
                </div>
              </div>
              <Button variant="primary" className="w-full" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}

          {/* ── STEP: failed ── */}
          {step === "failed" && (
            <div className="py-6 flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-red/10 flex items-center justify-center">
                <XCircle className="h-9 w-9 text-red" />
              </div>
              <div>
                <p className="font-bold text-lg text-red">Payment Failed</p>
                <p className="text-xs text-muted mt-1">Something went wrong. Please try again or use a different method.</p>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="secondary" className="flex-1" onClick={reset}>Try Again</Button>
                <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
