import type { PaymentType, PaymentMethod } from "@/types";

export interface CreatePaymentInput {
  userId?: string;
  userName: string;
  userEmail: string;
  userCountry?: string;
  type: PaymentType;
  description: string;
  amount: number;
  currency: string;
  method?: string;
  reference?: string;
  status?: "pending" | "completed" | "failed" | "expired";
  paidAt?: string;
  competitionId?: string;
  competitionTitle?: string;
}

export function generateReference(prefix = "REF"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export function normalizePaymentMethod(method?: string): PaymentMethod {
  const m = method?.toLowerCase() ?? "";
  if (m.includes("momo") || m.includes("mobile")) return "mobile_money";
  if (m.includes("visa") || m.includes("master") || m.includes("card")) return "card";
  if (m.includes("paypal")) return "paypal";
  if (m.includes("bank")) return "bank_transfer";
  return "card";
}

export async function createPayment(input: CreatePaymentInput) {
  const body = {
    ...input,
    method: normalizePaymentMethod(input.method),
    status: input.status || "completed",
    paidAt: input.paidAt || new Date().toISOString(),
  };

  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error("Failed to create payment record", await response.text());
    return null;
  }

  return await response.json();
}
