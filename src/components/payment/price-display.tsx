"use client";

import { useCurrency, fmtCurrency } from "@/lib/use-currency";
import type { PaymentType } from "@/types";

interface PriceDisplayProps {
  /** Amount in USD */
  amountUSD: number;
  paymentType?: PaymentType;
  /** Extra className for the primary price */
  className?: string;
  /** Show the alt currency below in smaller text */
  showAlt?: boolean;
}

/**
 * Renders a price in the user's correct currency (RWF for Rwandans, USD for international).
 * Respects admin currency settings per payment context.
 */
export function PriceDisplay({
  amountUSD,
  paymentType = "competition_entry",
  className = "",
  showAlt = true,
}: PriceDisplayProps) {
  const resolved = useCurrency(amountUSD, paymentType);

  if (amountUSD === 0) {
    return <span className={className}>Free</span>;
  }

  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={className}>{fmtCurrency(resolved.amount, resolved.currency)}</span>
      {showAlt && resolved.bothAccepted && resolved.altCurrency && (
        <span className="text-xs text-muted font-normal">
          ≈ {fmtCurrency(resolved.altAmount!, resolved.altCurrency)}
        </span>
      )}
    </span>
  );
}
