"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Smartphone,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface RwandaPayGatewayProps {
  amount: number;
  currency?: string;
  description?: string;
  defaultPhone?: string;
  onComplete: (transactionId: string) => void;
  onCancel: () => void;
}

type Step = "form" | "connecting" | "approve" | "verifying" | "success" | "error";

const providers = [
  { id: "mtn", label: "MTN Mobile Money", color: "#FBBF24" },
  { id: "airtel", label: "Airtel Money", color: "#EF4444", logo: "/images/airtel-logo-128.png" },
];

function normalizeDefaultPhone(value?: string) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("250")) return digits.slice(3);
  return digits;
}

export function RwandaPayGateway({
  amount,
  currency = "RWF",
  description = "Payment",
  defaultPhone,
  onComplete,
  onCancel,
}: RwandaPayGatewayProps) {
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState(() => normalizeDefaultPhone(defaultPhone));
  const [provider, setProvider] = useState(providers[0].id);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [transactionId, setTransactionId] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    setPhone(normalizeDefaultPhone(defaultPhone));
  }, [defaultPhone]);

  function simulateProgress(target: number, duration: number, onDone?: () => void) {
    const start = performance.now();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - start;
      const p = Math.min((elapsed / duration) * target, target);
      setProgress(p);
      if (p >= target) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onDone?.();
      }
    }, 50);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!phone || phone.length < 9) {
      setError("Please enter a valid mobile money number.");
      return;
    }

    startDemoFlow();
  }

  function startDemoFlow() {
    const tx = `RWP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setTransactionId(tx);
    setStep("connecting");
    setProgress(0);

    simulateProgress(35, 1200, () => {
      setStep("approve");
      setProgress(35);
      simulateProgress(70, 2500, () => {
        setStep("verifying");
        setProgress(70);
        simulateProgress(100, 1800, () => {
          setStep("success");
          setTimeout(() => onComplete(tx), 1200);
        });
      });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={step === "form" || step === "error" ? onCancel : undefined}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-yellow/20 bg-gradient-to-br from-[#0a0a12] to-[#0f1119] shadow-2xl"
      >
        {/* Glowing accent */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-yellow/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue/10 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow/15">
              <Smartphone className="h-5 w-5 text-yellow" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">MubaristaPay</p>
              <p className="text-[10px] text-muted">Mobile Money Checkout</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative p-6">
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(amount, currency)}
                  </p>
                  <p className="text-sm text-muted">{description}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Mobile Money Provider</label>
                  <div className="grid grid-cols-2 gap-3">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProvider(p.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                          provider === p.id
                            ? "border-yellow/50 bg-yellow/10 text-yellow"
                            : "border-white/10 bg-white/5 text-muted hover:bg-white/10"
                        }`}
                      >
                        {p.logo ? (
                          <div className="h-5 w-5 overflow-hidden rounded-full bg-white">
                            <Image src={p.logo} alt={p.label} width={20} height={20} className="h-5 w-5 object-cover" />
                          </div>
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                        )}
                        {p.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Phone Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="07XXXXXXXX"
                      className="w-full rounded-xl border border-white/10 bg-muted-bg py-3 pl-10 pr-4 text-sm text-white focus:border-yellow focus:outline-none focus:ring-1 focus:ring-yellow"
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted">
                    Demo mode: tapping Pay Now will simulate a RwandaPay confirmation.
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}

                <Button type="submit" variant="primary" className="w-full">
                  Pay Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.form>
            )}

            {step !== "form" && step !== "error" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow/10">
                  <AnimatePresence mode="wait">
                    {step === "success" ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle2 className="h-10 w-10 text-green" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="spinner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="h-10 w-10 animate-spin text-yellow" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {step === "connecting" && "Connecting to RwandaPay"}
                    {step === "approve" && "Approve on your phone"}
                    {step === "verifying" && "Verifying payment"}
                    {step === "success" && "Payment successful"}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {step === "connecting" && "Securely linking to your mobile money wallet…"}
                    {step === "approve" && "Please confirm the prompt on your mobile device."}
                    {step === "verifying" && "We are confirming the transaction…"}
                    {step === "success" && `Ref: ${transactionId}`}
                  </p>
                </div>

                {step !== "success" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted">
                      <span>Processing</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-gradient-to-r from-yellow to-yellow/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {step === "approve" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border border-yellow/10 bg-yellow/5 p-4"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <Send className="h-5 w-5 text-yellow" />
                      <p className="text-xs text-white">
                        A payment request has been sent to <strong>+250 {phone}</strong>. Accept it to continue.
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-green/20 bg-green/10 p-4 text-sm text-green"
                  >
                    <ShieldCheck className="mx-auto mb-2 h-6 w-6" />
                    Your payment of {formatCurrency(amount, currency)} has been received.
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
