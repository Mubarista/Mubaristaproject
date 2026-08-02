import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";
import { addSubscriptionDuration, formatCurrency } from "@/lib/utils";
import { createInvoiceFromPayment } from "@/lib/invoice";
import { createNotification } from "@/lib/notifications";

export async function completePayment(
  payment: any,
  transactionId: string,
  origin: string,
  webhookBody?: any
) {
  if (!payment) return;

  const now = new Date().toISOString();
  const meta = JSON.parse(payment.notes || "{}") || {};

  // Idempotent: do nothing if already completed
  if (payment.status === "completed") {
    return;
  }

  // Update payment record
  await supabaseAdmin
    .from("payments")
    .update({
      status: "completed",
      paid_at: now,
      notes: JSON.stringify({
        ...meta,
        transaction_id: transactionId,
        webhook: webhookBody || null,
        confirmed_at: now,
      }),
    })
    .eq("id", payment.id);

  // Activate premium subscription
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

  // Confirm competition entry and invalidate the payment link
  if (meta.type === "competition_entry" && meta.applicationId && payment.user_id) {
    await supabaseAdmin
      .from("competition_applications")
      .update({
        payment_status: "paid",
        paid_at: now,
        status: "active",
        access_link: null,
        access_link_expires_at: null,
        updated_at: now,
      })
      .eq("id", meta.applicationId);
  }

  // Fulfill tool / book orders
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
      }).catch((err) => console.error("Stock decrement failed:", err));
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
          orderId: payment.reference,
        }),
      }).catch((err) => console.error("Book delivery failed:", err));
    }
  }

  // Create invoice and send email
  try {
    const camelPayment = mapKeysToCamelCase(payment);
    camelPayment.status = "completed";
    camelPayment.paidAt = now;
    await createInvoiceFromPayment(camelPayment);
  } catch (err) {
  }

  // Notify user
  if (payment.user_id) {
    if (meta.type === "premium_subscription") {
      const expiryDate = addSubscriptionDuration(new Date(), meta.duration as "weekly" | "monthly" | "yearly").toLocaleDateString();
      await createNotification({
        userId: payment.user_id,
        title: "Premium subscription active",
        description: `Your ${meta.duration} premium subscription is now active. You paid ${formatCurrency(payment.amount, payment.currency || "RWF")}. It expires on ${expiryDate}.`,
        type: "subscription",
        metadata: { planId: meta.planId, reference: payment.reference, transactionId },
      });
    } else if (meta.type === "competition_entry") {
      await createNotification({
        userId: payment.user_id,
        title: "Competition entry confirmed",
        description: `Your application fee for ${payment.competition_title || "competition"} has been received. You are now active in the competition.`,
        type: "competition",
        metadata: { applicationId: meta.applicationId, reference: payment.reference, transactionId },
      });
    } else if (meta.type === "tool_purchase" || meta.type === "book_purchase") {
      await createNotification({
        userId: payment.user_id,
        title: "Payment confirmed",
        description: `We received ${formatCurrency(payment.amount, payment.currency || "RWF")} for your order. Your items are being processed.`,
        type: "order",
        metadata: { reference: payment.reference, transactionId, items: meta.items },
      });
    } else {
      await createNotification({
        userId: payment.user_id,
        title: "Payment received",
        description: `We received ${formatCurrency(payment.amount, payment.currency || "RWF")}. Reference: ${payment.reference}.`,
        type: "payment",
        metadata: { reference: payment.reference, transactionId },
      });
    }
  }
}
