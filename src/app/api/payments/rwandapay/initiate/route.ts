import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const RWANDAPAY_BASE_URL = "https://pay.rwandapay.rw/api/v1";

function getRwandaPayKeys() {
  const publicKey = process.env.RWANDAPAY_PUBLIC_KEY;
  const secretKey = process.env.RWANDAPAY_SECRET_KEY;
  if (!publicKey || !secretKey) {
    throw new Error("RwandaPay API keys are not configured");
  }
  return { publicKey, secretKey };
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

    const body = await req.json().catch(() => ({}));
    const { amount, tx_ref, customer, description, meta } = body;

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Amount must be at least 100 RWF" }, { status: 400 });
    }
    if (!tx_ref || tx_ref.length > 50) {
      return NextResponse.json({ error: "Invalid transaction reference" }, { status: 400 });
    }
    if (!customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json({ error: "Customer name, email and phone are required" }, { status: 400 });
    }

    const { publicKey, secretKey } = getRwandaPayKeys();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const redirectUrl = `${siteUrl}/payment/success`;
    const webhookUrl = `${siteUrl}/api/payments/rwandapay/webhook`;

    const payload = {
      amount,
      tx_ref,
      customer,
      currency: body.currency || "RWF",
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
      description: description || "MUBARISTA payment",
      meta: { ...meta, mubarista_reference: tx_ref },
    };

    const rwandaPayRes = await fetch(`${RWANDAPAY_BASE_URL}/checkout/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Public-Key": publicKey,
        "X-Secret-Key": secretKey,
      },
      body: JSON.stringify(payload),
    });

    const rwandaPayData = await rwandaPayRes.json().catch(() => ({
      success: false,
      message: "Invalid response from RwandaPay",
    }));

    if (!rwandaPayRes.ok || !rwandaPayData.success || !rwandaPayData.data?.payment_url) {
      console.error("RwandaPay initiate error:", rwandaPayData);
      return NextResponse.json(
        { error: rwandaPayData.message || "Failed to initialize RwandaPay checkout" },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    const paymentType = meta?.type || "tool_purchase";

    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: authData.user.id,
      user_name: customer.name,
      user_email: customer.email,
      user_country: meta?.userCountry || "",
      type: paymentType,
      description: description || "MUBARISTA payment",
      amount,
      currency: body.currency || "RWF",
      status: "pending",
      method: "mobile_money",
      reference: tx_ref,
      notes: JSON.stringify(meta || {}),
      created_at: now,
    });

    if (insertError) {
      console.error("Failed to create pending payment record:", insertError);
      return NextResponse.json({ error: "Failed to save payment record" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payment_url: rwandaPayData.data.payment_url,
      reference: tx_ref,
    });
  } catch (error: any) {
    console.error("RwandaPay initiate route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
