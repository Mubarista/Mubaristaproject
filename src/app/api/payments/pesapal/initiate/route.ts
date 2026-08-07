import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getPesapalBaseUrl,
  getPesapalCredentials,
  getPesapalAccessToken,
  getOrCreatePesapalIpnId,
  buildPesapalOrder,
  submitPesapalOrder,
} from "@/lib/pesapal";

const PESAPAL_IPN_METHOD = "GET";

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
    const { amount, reference, customer, currency, description, meta } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!reference || reference.length > 50) {
      return NextResponse.json({ error: "Invalid transaction reference" }, { status: 400 });
    }

    if (!customer?.name || (!customer?.email && !customer?.phone)) {
      return NextResponse.json(
        { error: "Customer name and either email or phone are required" },
        { status: 400 }
      );
    }

    const baseUrl = getPesapalBaseUrl();
    const { consumerKey, consumerSecret } = getPesapalCredentials();
    const tokenResponse = await getPesapalAccessToken(baseUrl, consumerKey, consumerSecret);
    const accessToken = tokenResponse.token;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const ipnUrl = `${siteUrl}/api/payments/pesapal/ipn`;
    const callbackUrl = `${siteUrl}/api/payments/pesapal/callback`;
    const cancellationUrl = `${siteUrl}/cart`;

    const notificationId = await getOrCreatePesapalIpnId(baseUrl, accessToken, ipnUrl, PESAPAL_IPN_METHOD);

    const paymentCurrency = currency || "RWF";
    const orderDescription = description || "MUBARISTA payment";

    const order = buildPesapalOrder({
      reference,
      amount,
      currency: paymentCurrency,
      description: orderDescription,
      callbackUrl,
      notificationId,
      cancellationUrl,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        countryCode: customer.country,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
      },
    });

    const orderResponse = await submitPesapalOrder(baseUrl, accessToken, order);

    const paymentType = meta?.type || "tool_purchase";
    const now = new Date().toISOString();

    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: authData.user.id,
      user_name: customer.name,
      user_email: customer.email,
      user_country: customer.country || "",
      type: paymentType,
      description: orderDescription,
      amount: Number(amount),
      currency: paymentCurrency,
      status: "pending",
      method: "card",
      reference,
      notes: JSON.stringify({
        ...meta,
        order_tracking_id: orderResponse.order_tracking_id,
        redirect_url: orderResponse.redirect_url,
        payment_provider: "pesapal",
      }),
      competition_id: meta?.competitionId || null,
      competition_title: meta?.competitionTitle || null,
      created_at: now,
    });

    if (insertError) {
      console.error("Failed to create pending Pesapal payment record:", insertError);
      return NextResponse.json({ error: "Failed to save payment record" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payment_url: orderResponse.redirect_url,
      reference,
      order_tracking_id: orderResponse.order_tracking_id,
      currency: paymentCurrency,
    });
  } catch (error: any) {
    console.error("Pesapal initiate route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
