import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { completePayment } from "@/lib/rwandapay";
import { createNotification } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";

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

    if (!isSuccess) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", paid_at: null })
        .eq("id", payment.id);

      if (payment.user_id) {
        await createNotification({
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
    await completePayment(payment, transactionId, origin, body);

    return NextResponse.json({ success: true, status: "completed" });
  } catch (error: any) {
    console.error("RwandaPay webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
