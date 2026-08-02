"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/* ── Confetti burst ─────────────────────────────────────────── */

const CONFETTI_COLORS = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#3b82f6", "#22c55e"];

function ConfettiBurst({ count = 28 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        y: -(Math.random() * 260 + 60),
        rotate: Math.random() * 720 - 360,
        scale: Math.random() * 0.6 + 0.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.3,
        width: Math.random() * 6 + 5,
        height: Math.random() * 4 + 8,
        round: Math.random() > 0.5,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute left-1/2 top-1/3">
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
            animate={{
              x: p.x,
              y: [0, p.y, p.y + 340],
              opacity: [1, 1, 0],
              rotate: p.rotate,
              scale: [0, p.scale, p.scale],
            }}
            transition={{ duration: 2.2, delay: p.delay, ease: [0.15, 0.6, 0.35, 1] }}
            className="absolute"
            style={{
              width: p.width,
              height: p.round ? p.width : p.height,
              backgroundColor: p.color,
              borderRadius: p.round ? "9999px" : "2px",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Animated icon circle ───────────────────────────────────── */

function AnimatedIconCircle({
  icon,
  color = "green",
}: {
  icon: React.ReactNode;
  color?: "green" | "yellow" | "blue" | "red";
}) {
  const bgMap = {
    green: "bg-green/10",
    yellow: "bg-yellow/10",
    blue: "bg-blue/10",
    red: "bg-red/10",
  };
  const ringMap = {
    green: "border-green/30",
    yellow: "border-yellow/30",
    blue: "border-blue/30",
    red: "border-red/30",
  };

  return (
    <div className="relative mx-auto mb-5 h-20 w-20">
      {/* Expanding pulse rings */}
      {[0, 0.5].map((delay) => (
        <motion.div
          key={delay}
          initial={{ scale: 0.7, opacity: 0.5 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 1.6, delay, repeat: Infinity, ease: "easeOut" }}
          className={`absolute inset-0 rounded-full border-2 ${ringMap[color]}`}
        />
      ))}

      {/* Main circle */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full ${bgMap[color]}`}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.3 }}
        >
          {icon}
        </motion.div>
      </motion.div>

      {/* Checkmark badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.55 }}
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-green shadow-lg"
      >
        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.7, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

interface SuccessConfirmationProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  reference?: string | null;
  footer?: React.ReactNode;
  color?: "green" | "yellow" | "blue" | "red";
  confetti?: boolean;
  className?: string;
}

export function SuccessConfirmation({
  icon,
  title,
  children,
  reference,
  footer,
  color = "green",
  confetti = true,
  className = "",
}: SuccessConfirmationProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl glass-card p-8 text-center ${className}`}>
      {confetti && <ConfettiBurst />}

      <AnimatedIconCircle icon={icon} color={color} />

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
        className="text-2xl font-bold mb-2"
      >
        {title}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>

      {reference && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4, ease: "easeOut" }}
          className="text-sm text-muted mt-4"
        >
          Reference: <strong>{reference}</strong>
        </motion.p>
      )}

      {footer && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" }}
          className="mt-6"
        >
          {footer}
        </motion.div>
      )}
    </div>
  );
}