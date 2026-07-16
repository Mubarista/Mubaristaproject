"use client";

import { motion } from "framer-motion";

export function LoadingDots() {
  return (
    <div className="inline-flex justify-center gap-3">
      {["blue", "green", "yellow", "red"].map((color, i) => (
        <motion.div
          key={color}
          className="h-3 w-3 rounded-full"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
            backgroundColor: [
              color === "blue" ? "#2563eb" : color === "green" ? "#16a34a" : color === "yellow" ? "#eab308" : "#dc2626",
              color === "blue" ? "#16a34a" : color === "green" ? "#eab308" : color === "yellow" ? "#dc2626" : "#2563eb",
              color === "blue" ? "#eab308" : color === "green" ? "#dc2626" : color === "yellow" ? "#2563eb" : "#16a34a",
              color === "blue" ? "#dc2626" : color === "green" ? "#2563eb" : color === "yellow" ? "#16a34a" : "#eab308",
              color === "blue" ? "#2563eb" : color === "green" ? "#16a34a" : color === "yellow" ? "#eab308" : "#dc2626",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
