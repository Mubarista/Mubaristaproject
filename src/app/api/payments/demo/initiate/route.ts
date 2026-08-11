import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { completePayment } from "@/lib/rwandapay";

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

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Amount must be at least 100 RWF" }, { status: 400 });
    }
    if (!reference || reference.length > 50) {
      return NextResponse.json({ error: "Invalid transaction reference" }, { status: 400 });
    }
    if (!customer?.name || !customer?.email) {
      return NextResponse.json({ error: "Customer name and email are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const paymentType = meta?.type || "tool_purchase";
    const paymentCurrency = currency || "RWF";
    const paymentDescription = description || "MUBARISTA payment";

    const { data: payment, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: authData.user.id,
        user_name: customer.name,
        user_email: customer.email,
        user_country: meta?.userCountry || customer.country || "",
        type: paymentType,
        description: paymentDescription,
        amount,
        currency: paymentCurrency,
        status: "pending",
        method: "demo",
        reference,
        notes: JSON.stringify(meta || {}),
        competition_id: meta?.competitionId || null,
        competition_title: meta?.competitionTitle || null,
        created_at: now,
      })
      .select("*")
      .single();

    if (insertError || !payment) {
      console.error("Failed to create demo payment record:", insertError);
      return NextResponse.json({ error: "Failed to save payment record" }, { status: 500 });
    }

    const transactionId = `DEMO-${reference}-${Date.now()}`;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    await completePayment(payment, transactionId, origin);

    const successUrl = `${origin}/payment/success?status=success&reference=${encodeURIComponent(
      reference
    )}&transaction_id=${encodeURIComponent(transactionId)}&provider=demo`;

    return NextResponse.json({
      success: true,
      payment_url: successUrl,
      reference,
    });
  } catch (error: any) {
    console.error("Demo initiate route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
