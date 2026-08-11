import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPaymentFailedEmail } from "@/lib/email";
import { completePayment } from "@/lib/rwandapay";
import {
  getPesapalBaseUrl,
  getPesapalCredentials,
  getPesapalAccessToken,
  getPesapalTransactionStatus,
  isPesapalPaymentSuccessful,
} from "@/lib/pesapal";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { reference, order_tracking_id } = body;

    if (!reference) {
      return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
    }

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ success: true, status: "completed", already: true });
    }

    if (!order_tracking_id) {
      return NextResponse.json(
        { success: true, status: payment.status },
        { status: 200 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const baseUrl = getPesapalBaseUrl();
    const { consumerKey, consumerSecret } = getPesapalCredentials();
    const tokenResponse = await getPesapalAccessToken(baseUrl, consumerKey, consumerSecret);
    const accessToken = tokenResponse.token;
    const transactionStatus = await getPesapalTransactionStatus(baseUrl, accessToken, order_tracking_id);

    if (isPesapalPaymentSuccessful(transactionStatus)) {
      await completePayment(payment, order_tracking_id, origin, transactionStatus);
      return NextResponse.json({ success: true, status: "completed" });
    }

    const failed =
      (transactionStatus.payment_status_description || "").toUpperCase() === "FAILED";

    if (failed && payment.status !== "completed" && payment.status !== "failed") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", paid_at: null })
        .eq("id", payment.id);

      if (payment.user_email) {
        await sendPaymentFailedEmail({
          to: payment.user_email,
          name: payment.user_name || "there",
          amount: payment.amount,
          currency: payment.currency || "RWF",
          reference: payment.reference,
          provider: "Pesapal",
        });
      }

      return NextResponse.json({ success: true, status: "failed" });
    }

    return NextResponse.json({ success: true, status: payment.status });
  } catch (error: any) {
    console.error("Pesapal confirm error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
