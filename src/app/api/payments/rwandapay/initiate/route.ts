import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

function getRwandaPayCredentials() {
  const publicKey = process.env.RWANDAPAY_PUBLIC_KEY;
  const secretKey = process.env.RWANDAPAY_SECRET_KEY;
  const baseUrl = process.env.RWANDAPAY_BASE_URL || "https://pay.rwandapay.rw/api/v1";
  if (!publicKey || !secretKey) {
    throw new Error("RwandaPay credentials are not configured");
  }
  return { publicKey, secretKey, baseUrl };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { publicKey, secretKey, baseUrl } = getRwandaPayCredentials();

    const body = await req.json().catch(() => ({}));
    const {
      amount,
      currency = "RWF",
      tx_ref,
      customer,
      description,
      redirect_url,
      webhook_url,
      meta,
    } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!tx_ref) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
    }

    if (!customer?.name || !customer?.phone) {
      return NextResponse.json(
        { error: "Customer name and phone are required" },
        { status: 400 }
      );
    }

    const idempotencyKey = randomUUID();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    const response = await fetch(`${baseUrl}/checkout/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Public-Key": publicKey,
        "X-Secret-Key": secretKey,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency,
        tx_ref,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || "",
        },
        description: description || "MUBARISTA payment",
        redirect_url: redirect_url || `${siteUrl}/payment/success`,
        webhook_url: webhook_url || `${siteUrl}/api/payments/rwandapay/webhook`,
        meta: meta || {},
      }),
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: "Invalid response from RwandaPay",
    }));

    if (!response.ok) {
      console.error("RwandaPay initiate failed:", data);
      return NextResponse.json(
        { error: data.message || data.error || "Failed to initialize RwandaPay checkout" },
        { status: response.status }
      );
    }

    const paymentData = data.data || {};

    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: authData.user.id,
      user_name: customer.name,
      user_email: customer.email || "",
      user_country: customer.country || "",
      type: meta?.type || "competition_entry",
      description: description || "MUBARISTA payment",
      amount: Number(amount),
      currency,
      status: "pending",
      method: "mobile_money",
      reference: tx_ref,
      notes: JSON.stringify({
        ...meta,
        session_id: paymentData.session_id,
        payment_url: paymentData.payment_url,
        payment_provider: "rwandapay",
        mode: paymentData.mode,
      }),
      competition_id: meta?.competitionId || null,
      competition_title: meta?.competitionTitle || null,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Failed to create pending RwandaPay payment record:", insertError);
      return NextResponse.json({ error: "Failed to save payment record" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payment_url: paymentData.payment_url,
      reference: tx_ref,
      session_id: paymentData.session_id,
      amount: Number(amount),
      currency,
    });
  } catch (error: any) {
    console.error("RwandaPay initiate route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
