"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface PremiumGateProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function PremiumGate({
  title = "Premium Content",
  description = "Register & Upgrade to Access Premium Content",
  children,
}: PremiumGateProps) {
  const { user, isPremium } = useAuth();

  // If user is premium, show the content
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[300px] rounded-2xl">
      <div className="pointer-events-none select-none blur-md opacity-60">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center glass-card rounded-2xl p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 max-w-md w-full"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow/10 border border-yellow/30">
            <Lock className="h-8 w-8 text-yellow" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted mb-6">{description}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!user ? (
              <Link href="/register">
                <Button variant="primary">Register</Button>
              </Link>
            ) : null}
            <Link href={user ? "/dashboard/participant" : "/register"}>
              <Button variant="premium">Upgrade to Premium</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
