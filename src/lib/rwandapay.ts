const RWANDAPAY_API_URL = "https://api.rwandapay.rw/api/v1/checkout/initialize";

interface RwandaPayCustomer {
  name: string;
  email: string;
  phone: string;
}

interface RwandaPayInitInput {
  amount: number;
  tx_ref: string;
  customer: RwandaPayCustomer;
  currency?: string;
  redirect_url?: string;
  webhook_url?: string;
  description?: string;
  meta?: Record<string, any>;
}

interface RwandaPayInitResult {
  success: boolean;
  checkout_url?: string;
  tx_ref?: string;
  message?: string;
  raw?: any;
}

function getKeys() {
  const publicKey = process.env.RWANDAPAY_PUBLIC_KEY || process.env.NEXT_PUBLIC_RWANDAPAY_PUBLIC_KEY;
  const secretKey = process.env.RWANDAPAY_SECRET_KEY;
  if (!publicKey || !secretKey) {
    throw new Error("RWANDAPAY_PUBLIC_KEY and RWANDAPAY_SECRET_KEY must be configured");
  }
  return { publicKey, secretKey };
}

export async function initializeRwandaPay(input: RwandaPayInitInput): Promise<RwandaPayInitResult> {
  const { publicKey, secretKey } = getKeys();

  const response = await fetch(RWANDAPAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Public-Key": publicKey,
      "X-Secret-Key": secretKey,
    },
    body: JSON.stringify({
      amount: input.amount,
      tx_ref: input.tx_ref,
      customer: input.customer,
      currency: input.currency || "RWF",
      redirect_url: input.redirect_url,
      webhook_url: input.webhook_url,
      description: input.description,
      meta: input.meta,
    }),
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      success: false,
      message: raw.message || `RwandaPay init failed: ${response.status}`,
      raw,
    };
  }

  return {
    success: true,
    checkout_url: raw.checkout_url || raw.data?.checkout_url || raw.redirect_url,
    tx_ref: input.tx_ref,
    raw,
  };
}
