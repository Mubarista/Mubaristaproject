"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SuccessPopup } from "@/components/ui/success-popup";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send reset link");
      setShowSuccessPopup(true);
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardTitle className="text-2xl mb-2 text-center">Reset Password</CardTitle>
        <p className="text-muted text-sm text-center mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="iraguha.mugisha@example.rw"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button variant="primary" type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted mt-4">
          <Link href="/login" className="text-blue hover:underline">Back to login</Link>
        </p>
      </Card>

      {/* Success popup */}
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Email Sent!"
        message="Check your email for a password reset link."
        icon="mail"
        duration={6000}
      />
    </div>
  );
}
