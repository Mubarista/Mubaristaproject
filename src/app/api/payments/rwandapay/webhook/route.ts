import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { addSubscriptionDuration } from "@/lib/utils";
import { createInvoiceFromPayment } from "@/lib/invoice";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid webhook body" }, { status: 400 });
  }

  const txRef = body.tx_ref || body.txRef || body.reference;
  const status = body.status || body.payment_status;

  if (!txRef) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("reference", txRef)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error || !payment) {
    console.error("RwandaPay webhook: payment not found", txRef, error);
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const isSuccess = String(status).toLowerCase() === "success" || String(status).toLowerCase() === "completed";

  const update: any = {
    status: isSuccess ? "completed" : "failed",
    paid_at: isSuccess ? now : null,
    notes: JSON.stringify(body),
    updated_at: now,
  };

  const { data: updatedPayment } = await supabaseAdmin
    .from("payments")
    .update(update)
    .eq("id", payment.id)
    .select()
    .single();

  if (isSuccess && updatedPayment) {
    const camel = mapKeysToCamelCase(updatedPayment) as any;
    createInvoiceFromPayment(camel).catch((err) => {
      console.error("RwandaPay webhook: invoice creation failed", err);
    });

    let meta: any = {};
    try {
      meta = payment.notes ? JSON.parse(payment.notes) : {};
    } catch {
      meta = {};
    }

    if (payment.type === "premium_subscription" && meta.planId && meta.duration) {
      const expiry = addSubscriptionDuration(new Date(), meta.duration);
      await supabaseAdmin
        .from("users")
        .update({
          is_premium: true,
          subscription_plan: meta.planId,
          subscription_duration: meta.duration,
          subscription_expiry: expiry.toISOString(),
          subscription_next_renewal: expiry.toISOString(),
          subscription_auto_renew: true,
          subscription_renewal_failures: 0,
          updated_at: now,
        })
        .eq("id", payment.user_id);
    }
  }

  return NextResponse.json({ received: true });
}
