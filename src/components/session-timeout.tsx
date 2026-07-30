"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { safeLocalStorage } from "@/lib/safe-storage";

const LAST_ACTIVITY_KEY = "mubarista_last_activity";
const REFRESH_AFTER = 5 * 60 * 1000;       // 5 minutes
const SIGN_OUT_AFTER = 30 * 24 * 60 * 60 * 1000; // 30 days

function getLastActivity(): number {
  const stored = safeLocalStorage.getItem(LAST_ACTIVITY_KEY);
  return stored ? Number(stored) : Date.now();
}

function updateLastActivity() {
  safeLocalStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function SessionTimeout() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll", "click", "mousemove"];
    const resetTimer = () => updateLastActivity();
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const inactiveFor = Date.now() - getLastActivity();

      if (inactiveFor > SIGN_OUT_AFTER) {
        logout();
        return;
      }

      if (inactiveFor > REFRESH_AFTER) {
        window.location.reload();
        return;
      }
    };

    const checkTimeout = () => {
      if (Date.now() - getLastActivity() > SIGN_OUT_AFTER) {
        logout();
      }
    };

    updateLastActivity();
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(checkTimeout, 60000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [user, logout]);

  return null;
}
