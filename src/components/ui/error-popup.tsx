"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

interface ErrorPopupProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  duration?: number; // auto-close in ms, 0 = no auto-close
}

export function ErrorPopup({
  open,
  onClose,
  title = "Validation Error",
  message,
  duration = 5000,
}: ErrorPopupProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open || duration === 0) return;

    setProgress(100);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [open, duration, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Popup */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl glass-card shadow-2xl"
            >
              {/* Top accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-red via-red-light to-red" />

              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Animated icon */}
                  <div className="relative shrink-0">
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 16,
                        delay: 0.15,
                      }}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-red/15"
                    >
                      <AlertCircle className="h-7 w-7 text-red" />
                    </motion.div>

                    {/* Pulse ring */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.6 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-2 border-red/40"
                    />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <motion.h3
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="text-lg font-bold"
                    >
                      {title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      className="mt-1 text-sm text-muted leading-relaxed"
                    >
                      {message}
                    </motion.p>
                  </div>

                  {/* Close button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    onClick={onClose}
                    className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-muted-bg hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Auto-dismiss progress bar */}
              {duration > 0 && (
                <div className="h-1 w-full bg-muted-bg">
                  <div
                    className="h-full bg-red/60 transition-[width] duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}