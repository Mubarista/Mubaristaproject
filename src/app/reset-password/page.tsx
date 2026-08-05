"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { LoadingDots } from "@/components/ui/loading-dots";
import { PasswordInput } from "@/components/ui/password-input";
import { supabaseReset } from "@/lib/supabase-reset";

function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      const { data: { session } } = await supabaseReset.auth.getSession();
      if (!isMounted) return;

      if (session) {
        setVerifying(false);
        return;
      }

      // If no session yet, wait for the implicit recovery token to be processed
      const { data: { subscription } } = supabaseReset.auth.onAuthStateChange(
        (event, newSession) => {
          if (!isMounted) return;
          if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || newSession) {
            setVerifying(false);
          }
        }
      );

      // Give the token a moment to be processed
      setTimeout(() => {
        if (isMounted && verifying) {
          setVerifying(false);
          supabaseReset.auth.getSession().then(({ data: { session: s } }) => {
            if (!isMounted) return;
            if (!s) {
              setError("Invalid or expired reset link. Please request a new one.");
            }
          });
        }
      }, 2500);

      return () => {
        subscription.unsubscribe();
      };
    };

    verify();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    setLoading(true);
    try {
      const { error: updateError } = await supabaseReset.auth.updateUser({ password });
      if (updateError) throw updateError;

      try {
        const { data: { session } } = await supabaseReset.auth.getSession();
        if (session?.access_token) {
          await fetch("/api/auth/notify-password-changed", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      } catch (notifyError) {
        console.error("Failed to send password changed notification:", notifyError);
      }

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

        {verifying ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <LoadingDots />
            <p className="text-sm text-muted">Verifying your reset link...</p>
          </div>
        ) : (
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
            <Button variant="primary" type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        )}
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
