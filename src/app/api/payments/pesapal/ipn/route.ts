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

function getIpnParams(req: NextRequest, body: any) {
  const searchParams = req.nextUrl.searchParams;
  return {
    orderTrackingId:
      searchParams.get("OrderTrackingId") || body?.OrderTrackingId,
    merchantReference:
      searchParams.get("OrderMerchantReference") || body?.OrderMerchantReference,
    orderNotificationType:
      searchParams.get("OrderNotificationType") || body?.OrderNotificationType,
  };
}

async function handleIpn(req: NextRequest, body: any = {}) {
  const { orderTrackingId, merchantReference, orderNotificationType } = getIpnParams(req, body);

  console.log("Pesapal IPN:", { orderTrackingId, merchantReference, orderNotificationType });

  const response = {
    orderNotificationType: orderNotificationType || "IPNCHANGE",
    orderTrackingId: orderTrackingId || "",
    orderMerchantReference: merchantReference || "",
    status: 200,
  };

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.json({ ...response, status: 200 });
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
      console.error("Pesapal IPN: payment not found", merchantReference, error);
      return NextResponse.json({ ...response, status: 500 });
    }

    if (isPesapalPaymentSuccessful(transactionStatus) && payment.status !== "completed") {
      await completePayment(payment, orderTrackingId, req.nextUrl.origin, transactionStatus);
    } else if (
      (transactionStatus.payment_status_description || "").toUpperCase() === "FAILED" &&
      payment.status !== "completed"
    ) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", paid_at: null })
        .eq("id", payment.id);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Pesapal IPN error:", error);
    return NextResponse.json({ ...response, status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleIpn(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleIpn(req, body);
}
