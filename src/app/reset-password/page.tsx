"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { LoadingDots } from "@/components/ui/loading-dots";
import { PasswordInput } from "@/components/ui/password-input";
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
      const msg = err.message || "";
      if (msg.toLowerCase().includes("pkce") || msg.toLowerCase().includes("code verifier")) {
        setError(
          "This reset link is only valid in the same browser where you requested it. " +
          "If you opened it in a different app/device, or cleared your browser data, " +
          "please request a new link using the same browser you will use to open it."
        );
      } else {
        setError(msg || "Failed to reset password. Please try again.");
      }
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
          <PasswordInput
            leftIcon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="New password"
          />
          <PasswordInput
            leftIcon={<Lock className="h-4 w-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Confirm new password"
          />
          {error && (
            <div className="p-4 rounded-xl bg-red/10 border border-red/30 text-sm">
              <p className="text-red">{error}</p>
              <Link href="/forgot-password" className="inline-block mt-2 text-blue hover:underline">
                Request a new reset link
              </Link>
            </div>
          )}
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
