"use client";

import { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function SubscribePrompt() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(user?.subscribed || false);

  if (!user || subscribed) return null;

  async function handleSubscribe() {
    setLoading(true);
    try {
      const { data } = await import("@/lib/supabase").then((m) => m.supabase.auth.getSession());
      const token = data.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/users/subscribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl glass-card p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-blue/10 flex items-center justify-center text-blue shrink-0">
          <Bell className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Stay in the loop</h3>
          <p className="text-sm text-muted">
            Get live notifications about upcoming events, new articles, and coffee history drops.
          </p>
        </div>
        <Button onClick={handleSubscribe} disabled={loading} variant="primary" className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bell className="h-4 w-4 mr-2" /> Subscribe</>}
        </Button>
      </div>
      {subscribed && (
        <div className="mt-4 p-3 rounded-lg bg-green/10 text-green text-sm flex items-center gap-2">
          <Check className="h-4 w-4" /> You are now subscribed.
        </div>
      )}
    </div>
  );
}
