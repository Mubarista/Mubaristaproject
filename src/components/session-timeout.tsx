"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

// 15 minutes of inactivity before auto-logout
const SESSION_TIMEOUT = 15 * 60 * 1000;

export function SessionTimeout() {
  const { user, logout } = useAuth();
  const lastActivity = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    lastActivity.current = Date.now();

    const resetTimer = () => {
      lastActivity.current = Date.now();
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll", "click", "mousemove"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    const checkInactivity = () => {
      if (Date.now() - lastActivity.current > SESSION_TIMEOUT) {
        logout();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };

    timerRef.current = setInterval(checkInactivity, 5000);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, logout]);

  return null;
}
