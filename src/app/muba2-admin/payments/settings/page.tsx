"use client";

import { useState, useEffect } from "react";
import type { PaymentMethod, SupportedCurrency } from "@/types";
import {
  ArrowLeft, CreditCard, Smartphone, Building2, Wallet,
  Globe, MapPin, Users, CheckCircle2, Save, DollarSign, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const METHOD_META: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  card:          { label: "Visa / Mastercard", icon: <CreditCard className="h-4 w-4" />,  color: "text-blue",   desc: "International credit/debit cards" },
  mobile_money:  { label: "MomoPay",  icon: <Smartphone className="h-4 w-4" />,  color: "text-yellow", desc: "MomoPay USSD payments" },
  bank_transfer: { label: "Bank Transfer",     icon: <Building2 className="h-4 w-4" />,   color: "text-green",  desc: "Direct bank wire transfer" },
  paypal:        { label: "PayPal",            icon: <Wallet className="h-4 w-4" />,      color: "text-purple", desc: "PayPal for international users" },
};

const REGION_META = {
  global:             { label: "All Regions",          icon: <Globe className="h-3.5 w-3.5" />,    color: "text-blue bg-blue/10" },
  rwanda_only:        { label: "Rwanda Only",           icon: <MapPin className="h-3.5 w-3.5" />,   color: "text-yellow bg-yellow/10" },
  international_only: { label: "International Only",    icon: <Users className="h-3.5 w-3.5" />,    color: "text-green bg-green/10" },
};

export default function PaymentSettingsPage() {
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [currencySettings, setCurrencySettings] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState(1300);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Local editing state
  const [local, setLocal] = useState<any[]>([]);
  const [localCurrency, setLocalCurrency] = useState<any[]>([]);
  const [localRate, setLocalRate] = useState("1300");
  const [localSymbol, setLocalSymbol] = useState("RWF");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/payment-settings");
      if (res.ok) {
        const data = await res.json();
        setPaymentSettings(data.paymentMethods || []);
        setCurrencySettings(data.currencySettings || []);
        setExchangeRate(data.exchangeRate || 1370);
        setLocal(JSON.parse(JSON.stringify(data.paymentMethods || [])));
        setLocalCurrency(JSON.parse(JSON.stringify(data.currencySettings || [])));
        setLocalRate(String(data.exchangeRate || 1370));
        setLocalSymbol(data.currency || "RWF");
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethods: local,
          currencySettings: localCurrency,
          exchangeRate: parseFloat(localRate),
          currency: localSymbol,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentSettings(data.paymentMethods);
        setCurrencySettings(data.currencySettings);
        setExchangeRate(data.exchangeRate);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (error) {
      console.error("Error saving payment settings:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  function toggleMethod(ctxIndex: number, methodIndex: number) {
    setLocal((prev: typeof local) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[ctxIndex].methods[methodIndex].enabled = !next[ctxIndex].methods[methodIndex].enabled;
      return next;
    });
  }

  function setRegion(ctxIndex: number, methodIndex: number, region: "global" | "rwanda_only" | "international_only") {
    setLocal((prev: typeof local) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[ctxIndex].methods[methodIndex].regions = region;
      return next;
    });
  }

  function toggleCurrency(ctxIndex: number, currency: SupportedCurrency) {
    setLocalCurrency((prev: typeof localCurrency) => {
      const next = JSON.parse(JSON.stringify(prev));
      const cur: SupportedCurrency[] = next[ctxIndex].acceptedCurrencies;
      if (cur.includes(currency)) {
        if (cur.length === 1) return prev; // must keep at least one
        next[ctxIndex].acceptedCurrencies = cur.filter((c: SupportedCurrency) => c !== currency);
      } else {
        next[ctxIndex].acceptedCurrencies = [...cur, currency];
      }
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/muba2-admin/payments" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Payment Method Settings</h1>
          <p className="text-muted text-sm">Control which payment methods are available per context and region</p>
        </div>
        <Button variant="primary" onClick={save} disabled={saved || saving}>
          {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      {/* Legend */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Region scope:</p>
        {Object.entries(REGION_META).map(([key, meta]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}>
            {meta.icon} {meta.label}
          </span>
        ))}
        <p className="text-xs text-muted ml-auto">Toggle = enabled/disabled · Region = who sees this method</p>
      </div>

      {/* ── Exchange Rate ── */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-yellow/10 text-yellow flex items-center justify-center shrink-0">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">USD → RWF Exchange Rate</h2>
            <p className="text-xs text-muted mt-0.5">All prices are stored in USD. RWF amounts are calculated using this rate.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm flex-1">
            <span className="text-muted font-medium">1 USD =</span>
            <input
              type="number"
              min="1"
              step="1"
              value={localRate}
              onChange={e => setLocalRate(e.target.value)}
              className="flex-1 bg-transparent font-bold focus:outline-none text-right w-24"
            />
            <span className="text-yellow font-semibold">RWF</span>
          </div>
          <div className="text-xs text-muted">
            <p>Example: 50,000 RWF</p>
            <p className="font-semibold text-foreground">= {(50 * (parseFloat(localRate) || 0)).toLocaleString()} RWF</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium mb-1.5 block">Default Currency Symbol</label>
          <input
            type="text"
            value={localSymbol}
            onChange={(e) => setLocalSymbol(e.target.value.toUpperCase())}
            className="rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue w-32"
            placeholder="RWF"
          />
          <p className="text-xs text-muted mt-1">This symbol is displayed for prices across the site.</p>
        </div>
      </div>

      {/* ── Currency Settings per context ── */}
      <div className="glass-card rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-white/10 bg-muted-bg/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue/10 text-blue flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Accepted Currencies per Context</h2>
              <p className="text-xs text-muted mt-0.5">Choose which currencies are accepted for each payment type</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {localCurrency.map((ctx: typeof localCurrency[0], ci: number) => (
            <div key={ctx.context} className="flex items-center gap-5 px-5 py-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{ctx.label}</p>
                <p className="text-xs text-muted mt-0.5">
                  {(ctx.acceptedCurrencies as SupportedCurrency[]).join(" + ")}
                  {ctx.acceptedCurrencies.includes("USD") && ctx.acceptedCurrencies.includes("RWF") && (
                    <span className="ml-2 text-green">· Both accepted</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {(["USD", "RWF"] as SupportedCurrency[]).map(cur => {
                  const active = ctx.acceptedCurrencies.includes(cur);
                  return (
                    <button
                      key={cur}
                      onClick={() => toggleCurrency(ci, cur)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        active
                          ? cur === "USD"
                            ? "border-blue bg-blue/10 text-blue"
                            : "border-yellow bg-yellow/10 text-yellow"
                          : "border-white/10 text-muted hover:border-white/30"
                      }`}
                    >
                      {cur === "USD" ? "$ USD" : "RWF"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Method Settings ── */}
      <h2 className="font-semibold mb-4 text-muted text-sm uppercase tracking-widest">Payment Methods</h2>
      <div className="space-y-6">
        {local.map((ctx: typeof local[0], ci: number) => (
          <div key={ctx.context} className="glass-card rounded-2xl overflow-hidden">
            {/* Context header */}
            <div className="px-5 py-4 border-b border-white/10 bg-muted-bg/20">
              <h2 className="font-semibold">{ctx.label}</h2>
              <p className="text-xs text-muted mt-0.5">
                {ctx.methods.filter((m: typeof ctx.methods[0]) => m.enabled).length} of {ctx.methods.length} methods enabled
              </p>
            </div>

            {/* Methods */}
            <div className="divide-y divide-white/5">
              {ctx.methods.map((rule: typeof ctx.methods[0], mi: number) => {
                const meta = METHOD_META[rule.method as PaymentMethod];
                const regionMeta = REGION_META[rule.regions as keyof typeof REGION_META];
                return (
                  <div key={rule.method} className={`flex items-center gap-5 px-5 py-4 transition-colors ${rule.enabled ? "" : "opacity-50"}`}>
                    {/* Method info */}
                    <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${rule.enabled ? "bg-white/5" : "bg-muted-bg"} ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${meta.color}`}>{meta.label}</p>
                      <p className="text-xs text-muted">{meta.desc}</p>
                    </div>

                    {/* Region selector */}
                    <div className="flex gap-1.5 flex-wrap">
                      {(["global", "rwanda_only", "international_only"] as const).map(r => {
                        const rm = REGION_META[r];
                        return (
                          <button
                            key={r}
                            onClick={() => setRegion(ci, mi, r)}
                            disabled={!rule.enabled}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              rule.regions === r
                                ? `${rm.color} border-current`
                                : "border-white/10 text-muted hover:border-white/30"
                            } disabled:pointer-events-none`}
                          >
                            {rm.icon} {rm.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleMethod(ci, mi)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${rule.enabled ? "bg-blue" : "bg-white/10"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${rule.enabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-6 rounded-2xl border border-blue/20 bg-blue/5 px-5 py-4 text-sm text-muted">
        <p><strong className="text-foreground">Note:</strong> Changes take effect immediately for new payment dialogs after saving. Existing in-progress payments are not affected. Regional scope determines which users see a given method — <em>Rwanda Only</em> means only users whose country is Rwanda will see it.</p>
      </div>
    </div>
  );
}
