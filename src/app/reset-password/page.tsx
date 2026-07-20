"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { LoadingDots } from "@/components/ui/loading-dots";
import { supabase } from "@/lib/supabase";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams?.get("code");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!code) {
      setError("Invalid or expired reset link.");
      return;
    }

    setLoading(true);
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setMessage("Password updated successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardTitle className="text-2xl mb-2 text-center">Set New Password</CardTitle>
        <p className="text-muted text-sm text-center mb-6">
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="New password"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="Confirm new password"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green">{message}</p>}
          <Button variant="primary" type="submit" className="w-full" disabled={loading || !code}>
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
          <Card className="w-full max-w-md flex items-center justify-center py-12">
            <LoadingDots />
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
