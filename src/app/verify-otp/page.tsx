"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const { verifyOTP, sendOTP } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await verifyOTP(email, code);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.message || "Invalid OTP");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || !email) return;
    const result = await sendOTP(email);
    if (result.success) {
      setCountdown(60);
      setError("");
    } else {
      setError(result.message || "Failed to resend OTP");
    }
  }

  if (!email) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-6 text-center">
          <CardTitle className="mb-2">No email provided</CardTitle>
          <p className="text-muted text-sm mb-4">Please start from the login or registration page.</p>
          <Button variant="primary" onClick={() => router.push("/login")}>Go to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <Card className="relative w-full max-w-md p-6 overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue via-green to-yellow" />

          <div className="text-center mb-6">
            {/* Animated icon */}
            <div className="relative mx-auto mb-4 h-16 w-16">
              {[0, 0.5].map((delay) => (
                <motion.div
                  key={delay}
                  initial={{ scale: 0.7, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.6, delay, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-blue/30"
                />
              ))}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue/10"
              >
                <ShieldCheck className="h-8 w-8 text-blue" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <CardTitle className="text-2xl mb-2">Verify your email</CardTitle>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="text-muted text-sm"
            >
              Enter the 6-digit code sent to <span className="text-foreground font-medium">{email}</span>
            </motion.p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.35 }}
            onSubmit={handleVerify}
            className="space-y-4"
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="------"
              autoFocus
              className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue"
              required
            />
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red/10 border border-red/30 rounded-lg p-3 text-sm text-red overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className="text-sm text-blue hover:underline disabled:text-muted disabled:no-underline w-full text-center"
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
            </button>
          </motion.form>
        </Card>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
          <p className="text-muted">Loading...</p>
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
