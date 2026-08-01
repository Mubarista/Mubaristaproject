import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { initializeRwandaPay } from "@/lib/rwandapay";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const user = authData.user;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    amount,
    tx_ref,
    customer,
    currency = "RWF",
    redirect_url,
    description,
    type,
    meta,
  } = body;

  if (!amount || !tx_ref || !customer?.phone || !customer?.email) {
    return NextResponse.json(
      { error: "Missing required fields: amount, tx_ref, customer phone/email" },
      { status: 400 }
    );
  }

  const { data: payment, error: insertError } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: user.id,
      user_name: customer.name || user.user_metadata?.name || user.email,
      user_email: customer.email,
      user_country: meta?.country || user.user_metadata?.country || "",
      type: type || "tool_purchase",
      description: description || "RwandaPay payment",
      amount,
      currency,
      status: "pending",
      method: "rwandapay",
      reference: tx_ref,
      notes: meta ? JSON.stringify(meta) : null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("RwandaPay initiate: failed to record payment", insertError);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarista.com";
  const result = await initializeRwandaPay({
    amount,
    tx_ref,
    customer,
    currency,
    redirect_url: redirect_url || `${siteUrl}/dashboard`,
    webhook_url: `${siteUrl}/api/payments/rwandapay/webhook`,
    description,
    meta: { payment_id: payment.id, ...meta },
  });

  if (!result.success) {
    await supabaseAdmin
      .from("payments")
      .update({ status: "failed", notes: result.message || "Init failed" })
      .eq("id", payment.id);
    return NextResponse.json({ error: result.message || "RwandaPay init failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    checkout_url: result.checkout_url,
    tx_ref,
    payment_id: payment.id,
  });
}
