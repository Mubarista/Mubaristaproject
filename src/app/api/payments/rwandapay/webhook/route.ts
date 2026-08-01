import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { addSubscriptionDuration, formatCurrency } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const reference = body.tx_ref || body.reference;
    const status = body.status || body.payment_status;
    const transactionId = body.transaction_id || body.id;

    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("RwandaPay webhook: payment not found", reference, paymentError);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const isSuccess =
      String(status).toLowerCase() === "successful" ||
      String(status).toLowerCase() === "success";

    const now = new Date().toISOString();
    const meta = JSON.parse(payment.notes || "{}");

    await supabaseAdmin
      .from("payments")
      .update({
        status: isSuccess ? "completed" : "failed",
        paid_at: isSuccess ? now : null,
        notes: JSON.stringify({
          ...meta,
          webhook: body,
          transaction_id: transactionId,
        }),
      })
      .eq("id", payment.id);

    if (!isSuccess) {
      if (payment.user_id) {
        createNotification({
          userId: payment.user_id,
          title: "Payment failed",
          description: `Your payment of ${formatCurrency(payment.amount, payment.currency || "RWF")} could not be completed. Reference: ${reference}. Please try again.`,
          type: "warning",
          metadata: { reference, transactionId },
        });
      }
      return NextResponse.json({ success: true, status: "failed" });
    }

    const origin = req.nextUrl.origin;

    if (meta.type === "premium_subscription" && meta.planId && meta.duration && payment.user_id) {
      const nowDate = new Date();
      const expiry = addSubscriptionDuration(nowDate, meta.duration as "weekly" | "monthly" | "yearly");

      await supabaseAdmin
        .from("users")
        .update({
          is_premium: true,
          subscription_plan: meta.planId,
          subscription_duration: meta.duration,
          subscription_expiry: expiry.toISOString(),
          subscription_next_renewal: expiry.toISOString(),
          subscription_auto_renew: false,
          subscription_canceled_at: null,
          subscription_renewal_failures: 0,
          updated_at: now,
        })
        .eq("id", payment.user_id);
    }

    if (meta.type === "competition_entry" && meta.applicationId && payment.user_id) {
      await supabaseAdmin
        .from("competition_applications")
        .update({
          payment_status: "paid",
          paid_at: now,
          status: "active",
          updated_at: now,
        })
        .eq("id", meta.applicationId);
    }

    if (
      (meta.type === "tool_purchase" || meta.type === "book_purchase") &&
      Array.isArray(meta.items) &&
      meta.items.length > 0
    ) {
      const toolItems = meta.items.filter((item: any) => item.type === "tool" && item.quantity > 0);
      if (toolItems.length > 0) {
        await fetch(`${origin}/api/tools/decrement-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: toolItems.map((item: any) => ({ id: item.id, quantity: item.quantity })),
          }),
        }).catch((err) => console.error("Webhook stock decrement failed:", err));
      }

      const bookItems = meta.items.filter((item: any) => item.type === "book");
      if (bookItems.length > 0) {
        const email = meta.shippingAddress?.email || payment.user_email;
        const customerName = meta.shippingAddress?.fullName || payment.user_name;
        await fetch(`${origin}/api/books/deliver`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookIds: bookItems.map((item: any) => item.id),
            email,
            customerName,
            orderId: reference,
          }),
        }).catch((err) => console.error("Webhook book delivery failed:", err));
      }
    }

    if (payment.user_id) {
      if (meta.type === "premium_subscription") {
        const expiryDate = addSubscriptionDuration(new Date(), meta.duration as "weekly" | "monthly" | "yearly").toLocaleDateString();
        createNotification({
          userId: payment.user_id,
          title: "Premium subscription active",
          description: `Your ${meta.duration} premium subscription is now active. You paid ${formatCurrency(payment.amount, payment.currency || "RWF")}. It expires on ${expiryDate}.`,
          type: "subscription",
          metadata: { planId: meta.planId, reference, transactionId },
        });
      } else if (meta.type === "competition_entry") {
        createNotification({
          userId: payment.user_id,
          title: "Competition entry confirmed",
          description: `Your application fee for ${payment.competition_title || "competition"} has been received. You are now active in the competition.`,
          type: "competition",
          metadata: { applicationId: meta.applicationId, reference, transactionId },
        });
      } else if (meta.type === "tool_purchase" || meta.type === "book_purchase") {
        createNotification({
          userId: payment.user_id,
          title: "Payment confirmed",
          description: `We received ${formatCurrency(payment.amount, payment.currency || "RWF")} for your order. Your items are being processed.`,
          type: "order",
          metadata: { reference, transactionId, items: meta.items },
        });
      } else {
        createNotification({
          userId: payment.user_id,
          title: "Payment received",
          description: `We received ${formatCurrency(payment.amount, payment.currency || "RWF")}. Reference: ${reference}.`,
          type: "payment",
          metadata: { reference, transactionId },
        });
      }
    }

    return NextResponse.json({ success: true, status: "completed" });
  } catch (error: any) {
    console.error("RwandaPay webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
