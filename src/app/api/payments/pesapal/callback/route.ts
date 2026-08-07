import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { completePayment } from "@/lib/rwandapay";
import {
  getPesapalBaseUrl,
  getPesapalCredentials,
  getPesapalAccessToken,
  getPesapalTransactionStatus,
  isPesapalPaymentSuccessful,
} from "@/lib/pesapal";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");
  const notificationType = searchParams.get("OrderNotificationType");

  console.log("Pesapal callback:", { orderTrackingId, merchantReference, notificationType });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const failureUrl = `${siteUrl}/payment/success?status=failed&reference=${encodeURIComponent(
    merchantReference || ""
  )}&transaction_id=${encodeURIComponent(orderTrackingId || "")}&provider=pesapal`;

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.redirect(failureUrl);
  }

  try {
    const baseUrl = getPesapalBaseUrl();
    const { consumerKey, consumerSecret } = getPesapalCredentials();
    const tokenResponse = await getPesapalAccessToken(baseUrl, consumerKey, consumerSecret);
    const accessToken = tokenResponse.token;
    const transactionStatus = await getPesapalTransactionStatus(baseUrl, accessToken, orderTrackingId);

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("reference", merchantReference)
      .maybeSingle();

    if (error || !payment) {
      console.error("Pesapal callback: payment not found", merchantReference, error);
    } else if (isPesapalPaymentSuccessful(transactionStatus)) {
      await completePayment(payment, orderTrackingId, req.nextUrl.origin, transactionStatus);
    } else {
      const now = new Date().toISOString();
      const status =
        (transactionStatus.payment_status_description || "").toUpperCase() === "FAILED"
          ? "failed"
          : payment.status === "completed"
          ? "completed"
          : payment.status;

      if (status !== payment.status) {
        await supabaseAdmin.from("payments").update({ status, paid_at: null }).eq("id", payment.id);
      }
    }

    const isSuccess = isPesapalPaymentSuccessful(transactionStatus);
    const redirectUrl = `${siteUrl}/payment/success?status=${
      isSuccess ? "successful" : "failed"
    }&reference=${encodeURIComponent(merchantReference)}&transaction_id=${encodeURIComponent(
      orderTrackingId
    )}&provider=pesapal`;

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("Pesapal callback error:", error);
    return NextResponse.redirect(failureUrl);
  }
}
