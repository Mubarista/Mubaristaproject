import type { PaymentType, PaymentMethod } from "@/types";
import { supabase } from "@/lib/supabase";

export interface RwandaPayInitiateInput {
  amount: number;
  tx_ref: string;
  customer: { name: string; email: string; phone: string };
  currency?: string;
  description: string;
  meta: Record<string, any>;
}

export interface PesapalInitiateInput {
  amount: number;
  reference: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    country: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  currency: string;
  description: string;
  meta: Record<string, any>;
}

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

export async function initiateRwandaPay(input: RwandaPayInitiateInput): Promise<{ payment_url: string; reference: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Please log in to make a payment.");
  }

  const response = await fetch("/api/payments/rwandapay/initiate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => ({ error: "Invalid response" }));
  if (!response.ok) {
    throw new Error(data.error || "Failed to start RwandaPay payment");
  }

  return data as { payment_url: string; reference: string };
}

export async function initiatePesapal(input: PesapalInitiateInput): Promise<{
  payment_url: string;
  reference: string;
  order_tracking_id: string;
  currency: string;
}> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Please log in to make a payment.");
  }

  const response = await fetch("/api/payments/pesapal/initiate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => ({ error: "Invalid response" }));
  if (!response.ok) {
    throw new Error(data.error || "Failed to start Pesapal payment");
  }

  return data as { payment_url: string; reference: string; order_tracking_id: string; currency: string };
}
