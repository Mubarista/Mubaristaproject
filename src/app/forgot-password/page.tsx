"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardTitle className="text-2xl mb-2 text-center">Reset Password</CardTitle>
        <p className="text-muted text-sm text-center mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <form className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="email"
              required
              className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="iraguha.mugisha@example.rw"
            />
          </div>
          <Button variant="primary" type="submit" className="w-full">
            Send Reset Link
          </Button>
        </form>
        <p className="text-center text-sm text-muted mt-4">
          <Link href="/login" className="text-blue hover:underline">Back to login</Link>
        </p>
      </Card>
    </div>
  );
}
