"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const MIN_DISPLAY_MS = 1100;
const FADE_MS = 550;
const FALLBACK_MS = 6000;

/**
 * Full-screen boot loader shown on every hard load / refresh.
 * Waits for the window `load` event (all resources fetched) plus a
 * minimum display time, then fades out before revealing the app.
 */
export function AppBootLoader() {
  const [phase, setPhase] = useState<"loading" | "exiting" | "done">("loading");

  useEffect(() => {
    const startedAt = Date.now();
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const beginExit = () => {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      exitTimer = setTimeout(() => {
        setPhase("exiting");
        setTimeout(() => setPhase("done"), FADE_MS);
      }, wait);
    };

    if (document.readyState === "complete") {
      beginExit();
    } else {
      window.addEventListener("load", beginExit, { once: true });
      // Safety net: never trap the user on the loader
      fallbackTimer = setTimeout(beginExit, FALLBACK_MS);
    }

    return () => {
      window.removeEventListener("load", beginExit);
      if (exitTimer) clearTimeout(exitTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="boot-loader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: FADE_MS / 1000, ease: "easeInOut" } }}
          aria-busy="true"
          role="status"
        >
          {/* Ambient coffee-crema glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(52rem 32rem at 50% 18%, rgba(234,179,8,0.10), transparent 60%), radial-gradient(40rem 28rem at 82% 88%, rgba(180,83,9,0.08), transparent 65%), radial-gradient(36rem 26rem at 12% 82%, rgba(120,53,15,0.08), transparent 60%)",
            }}
          />

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative flex flex-col items-center"
          >
            <span className="text-3xl sm:text-4xl font-bold tracking-tight leading-none animate-gradient-text">
              MUBARISTA
              <span className="text-[0.45em] tracking-widest uppercase align-top ml-1">HUB</span>
            </span>

            {/* Spinner */}
            <div className="relative mt-10 flex items-center justify-center">
              <span className="absolute h-16 w-16 rounded-full bg-yellow/10 animate-ping [animation-duration:1.8s]" aria-hidden />
              <span className="absolute h-12 w-12 rounded-full border border-yellow/20" aria-hidden />
              <Loader2 className="relative h-9 w-9 animate-spin text-yellow" strokeWidth={2.2} />
            </div>

            {/* Tagline with pulsing dots */}
            <div className="mt-8 flex items-center gap-0.5 text-sm text-muted">
              <span>Brewing your experience</span>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="ml-0.5 inline-block h-1 w-1 rounded-full bg-yellow"
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                />
              ))}
            </div>
          </motion.div>

          {/* Bottom shimmer bar */}
          <div className="absolute bottom-10 left-1/2 h-px w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={cn("h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-yellow to-transparent")}
              animate={{ x: ["-120%", "340%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}