import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "blue" | "green" | "yellow" | "red" | "default" | "premium";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        {
          "bg-blue/10 text-blue border border-blue/20": variant === "blue",
          "bg-green/10 text-green border border-green/20": variant === "green",
          "bg-yellow/10 text-yellow border border-yellow/20": variant === "yellow",
          "bg-red/10 text-red border border-red/20": variant === "red",
          "bg-muted-bg text-muted border border-white/10": variant === "default",
          "bg-gradient-to-r from-yellow/20 to-green/20 text-gold border border-yellow/30":
            variant === "premium",
        },
        className
      )}
      {...props}
    />
  );
}
