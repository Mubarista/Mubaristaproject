import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | undefined | null): string {
  if (num == null) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatCurrency(amount: number, currency = "RWF"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DEFAULT_IMAGE = "/logo-bimi.svg";

export function getImageUrl(src?: string | null): string {
  return src && src.trim() !== "" ? src : DEFAULT_IMAGE;
}

export function addSubscriptionDuration(
  date: Date,
  duration: "weekly" | "monthly" | "yearly"
): Date {
  const result = new Date(date);
  if (duration === "weekly") {
    result.setDate(result.getDate() + 7);
  } else if (duration === "monthly") {
    result.setMonth(result.getMonth() + 1);
  } else if (duration === "yearly") {
    result.setFullYear(result.getFullYear() + 1);
  }
  return result;
}
