"use client";

import { useAdminData } from "@/lib/admin-data-context";
import { useAuth } from "@/lib/auth-context";
import type { PaymentType, SupportedCurrency } from "@/types";

export interface ResolvedPrice {
  /** The primary currency the user should pay in */
  currency: SupportedCurrency;
  /** The amount in the primary currency */
  amount: number;
  /** The secondary currency if admin allows both (for display only) */
  altCurrency?: SupportedCurrency;
  /** The amount in the secondary currency (for display only) */
  altAmount?: number;
  /** Whether both currencies are accepted for this context */
  bothAccepted: boolean;
  /** Whether this is a Rwandan user */
  isRwandan: boolean;
  /** Current USD→RWF exchange rate */
  exchangeRate: number;
}

/**
 * Resolves the correct price and currency for a user based on:
 * 1. Their country (Rwanda → RWF, international → USD)
 * 2. Admin currency settings per payment context
 *
 * The base amount is always stored in USD. RWF = USD × exchangeRate.
 */
export function useCurrency(
  amountUSD: number,
  paymentType: PaymentType = "competition_entry"
): ResolvedPrice {
  const { exchangeRate, currencySettings } = useAdminData();
  const { user } = useAuth();

  const userCountry = user?.country ?? "";
  const isRwandan =
    userCountry.toLowerCase().includes("rwanda") ||
    userCountry.toUpperCase() === "RW";

  const contextCfg = currencySettings.find(c => c.context === paymentType);
  const accepted: SupportedCurrency[] = contextCfg?.acceptedCurrencies ?? ["USD", "RWF"];

  const rwfAmount = Math.round(amountUSD * exchangeRate);

  // Both currencies accepted — show primary for their region, secondary as alt
  if (accepted.includes("USD") && accepted.includes("RWF")) {
    if (isRwandan) {
      return {
        currency: "RWF",
        amount: rwfAmount,
        altCurrency: "USD",
        altAmount: amountUSD,
        bothAccepted: true,
        isRwandan,
        exchangeRate,
      };
    }
    return {
      currency: "USD",
      amount: amountUSD,
      altCurrency: "RWF",
      altAmount: rwfAmount,
      bothAccepted: true,
      isRwandan,
      exchangeRate,
    };
  }

  // Admin restricted to RWF only
  if (accepted.includes("RWF") && !accepted.includes("USD")) {
    return {
      currency: "RWF",
      amount: rwfAmount,
      bothAccepted: false,
      isRwandan,
      exchangeRate,
    };
  }

  // Admin restricted to USD only (default/fallback changed to RWF)
  return {
    currency: "RWF",
    amount: rwfAmount,
    bothAccepted: false,
    isRwandan,
    exchangeRate,
  };
}

/** Format a number as currency with proper locale */
export function fmtCurrency(amount: number, currency: SupportedCurrency): string {
  if (currency === "RWF") {
    return new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
