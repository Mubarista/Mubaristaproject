const SANDBOX_BASE_URL = "https://cybqa.pesapal.com/pesapalv3";
const LIVE_BASE_URL = "https://pay.pesapal.com/v3";

export function getPesapalBaseUrl(): string {
  const env = process.env.PESAPAL_ENV?.toLowerCase() || "sandbox";
  return env === "live" ? LIVE_BASE_URL : SANDBOX_BASE_URL;
}

export function getPesapalCredentials(): { consumerKey: string; consumerSecret: string } {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  // Sandbox demo credentials from Pesapal sample repo. Replace in production.
  if (!consumerKey || !consumerSecret) {
    return {
      consumerKey: "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW",
      consumerSecret: "osGQ364R49cXKeOYSpaOnT++rHs=",
    };
  }

  return { consumerKey, consumerSecret };
}

export interface PesapalToken {
  token: string;
  expiryDate: string;
  error: any;
  status: string;
  message: string;
}

export async function getPesapalAccessToken(baseUrl: string, consumerKey: string, consumerSecret: string): Promise<PesapalToken> {
  const res = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    console.error("Pesapal token error:", data);
    throw new Error(data.message || data.error?.message || "Failed to get Pesapal access token");
  }

  return data as PesapalToken;
}

export interface PesapalIpnRecord {
  url: string;
  created_date: string;
  ipn_id: string;
  notification_type?: number;
  ipn_notification_type_description?: string;
  ipn_status?: number;
  ipn_status_description?: string;
  error?: any;
  status?: string;
}

export async function getPesapalIpnList(baseUrl: string, token: string): Promise<PesapalIpnRecord[]> {
  const res = await fetch(`${baseUrl}/api/URLSetup/GetIpnList`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => []);

  if (!res.ok) {
    console.error("Pesapal IPN list error:", data);
    throw new Error("Failed to fetch Pesapal IPN list");
  }

  return Array.isArray(data) ? data : [];
}

export async function registerPesapalIpn(
  baseUrl: string,
  token: string,
  callbackUrl: string,
  ipnMethod: "GET" | "POST" = "GET"
): Promise<PesapalIpnRecord> {
  const res = await fetch(`${baseUrl}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: callbackUrl, ipn_notification_type: ipnMethod }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    console.error("Pesapal IPN registration error:", data);
    throw new Error(data.message || data.error?.message || "Failed to register Pesapal IPN");
  }

  return data as PesapalIpnRecord;
}

export async function getOrCreatePesapalIpnId(
  baseUrl: string,
  token: string,
  callbackUrl: string,
  ipnMethod: "GET" | "POST" = "GET"
): Promise<string> {
  try {
    const list = await getPesapalIpnList(baseUrl, token);
    const existing = list.find((ipn) => ipn.url === callbackUrl);
    if (existing?.ipn_id) return existing.ipn_id;
  } catch (error) {
    console.warn("Pesapal IPN list fetch failed, will try to register:", error);
  }

  const registered = await registerPesapalIpn(baseUrl, token, callbackUrl, ipnMethod);
  if (!registered?.ipn_id) {
    throw new Error("Pesapal did not return an IPN id");
  }
  return registered.ipn_id;
}

export interface PesapalOrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  cancellation_url?: string;
  billing_address: {
    phone_number?: string;
    email_address?: string;
    country_code?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
  language?: string;
  terms_and_conditions_id?: string;
  account_number?: string;
  subscription_details?: {
    start_date: string;
    end_date: string;
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  };
}

export interface PesapalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: any;
  message?: string;
  status?: string;
}

function sanitizePesapalString(value: string | undefined, max: number): string {
  if (!value) return "";
  return value.trim().slice(0, max);
}

function splitName(fullName: string): { first: string; middle: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0], middle: "", last: "" };
  if (parts.length === 2) return { first: parts[0], middle: "", last: parts[1] };
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(" "),
    last: parts[parts.length - 1],
  };
}

export function buildPesapalOrder(
  input: {
    reference: string;
    amount: number;
    currency: string;
    description: string;
    callbackUrl: string;
    notificationId: string;
    cancellationUrl?: string;
    customer: {
      name: string;
      email: string;
      phone: string;
      countryCode: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  }
): PesapalOrderRequest {
  const { first, middle, last } = splitName(input.customer.name);

  return {
    id: input.reference.slice(0, 50),
    currency: input.currency,
    amount: Number(input.amount).toFixed(2),
    description: sanitizePesapalString(input.description, 100),
    callback_url: input.callbackUrl,
    notification_id: input.notificationId,
    cancellation_url: input.cancellationUrl,
    language: "EN",
    terms_and_conditions_id: "",
    billing_address: {
      phone_number: sanitizePesapalString(input.customer.phone, 50),
      email_address: sanitizePesapalString(input.customer.email, 100),
      country_code: sanitizePesapalString(input.customer.countryCode, 2).toUpperCase(),
      first_name: sanitizePesapalString(first, 50),
      middle_name: sanitizePesapalString(middle, 50),
      last_name: sanitizePesapalString(last, 50),
      line_1: sanitizePesapalString(input.customer.address, 100),
      line_2: "",
      city: sanitizePesapalString(input.customer.city, 50),
      state: sanitizePesapalString(input.customer.state, 3).toUpperCase(),
      postal_code: sanitizePesapalString(input.customer.zipCode, 10),
      zip_code: sanitizePesapalString(input.customer.zipCode, 10),
    },
  } as unknown as PesapalOrderRequest;
}

export async function submitPesapalOrder(
  baseUrl: string,
  token: string,
  order: PesapalOrderRequest
): Promise<PesapalOrderResponse> {
  const res = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(order),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    console.error("Pesapal submit order error:", data);
    throw new Error(data.message || data.error?.message || "Failed to submit Pesapal order");
  }

  if (!data.redirect_url || !data.order_tracking_id) {
    throw new Error("Pesapal order response missing redirect_url or order_tracking_id");
  }

  return data as PesapalOrderResponse;
}

export interface PesapalTransactionStatus {
  payment_method?: string;
  amount?: number;
  created_date?: string;
  confirmation_code?: string;
  payment_status_description?: "INVALID" | "COMPLETED" | "FAILED" | "REVERSED" | string;
  description?: string;
  message?: string;
  payment_account?: string;
  call_back_url?: string;
  status_code?: number;
  merchant_reference?: string;
  currency?: string;
  error?: any;
  status?: string;
}

export async function getPesapalTransactionStatus(
  baseUrl: string,
  token: string,
  orderTrackingId: string
): Promise<PesapalTransactionStatus> {
  const res = await fetch(
    `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    console.error("Pesapal transaction status error:", data);
    throw new Error(data.message || data.error?.message || "Failed to get Pesapal transaction status");
  }

  return data as PesapalTransactionStatus;
}

export function isPesapalPaymentSuccessful(status: PesapalTransactionStatus): boolean {
  const statusDescription = (status.payment_status_description || "").toUpperCase();
  return statusDescription === "COMPLETED" && (status.status === "200" || Number(status.status_code) === 1);
}
