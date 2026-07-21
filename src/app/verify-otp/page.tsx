"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <CardTitle className="text-2xl mb-2">Verify your email</CardTitle>
          <p className="text-muted text-sm">
            Enter the 6-digit code sent to <span className="text-foreground">{email}</span>
          </p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue"
            required
          />
          {error && (
            <div className="bg-red/10 border border-red/30 rounded-lg p-3 text-sm text-red">
              {error}
            </div>
          )}
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
        </form>
      </Card>
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
