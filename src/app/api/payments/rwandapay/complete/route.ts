import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { completePayment } from "@/lib/rwandapay";

function getBaseUrl() {
  return process.env.RWANDAPAY_BASE_URL || "https://pay.rwandapay.rw/api/v1";
}

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
    const { reference, paymentReference = reference } = body;

    if (!reference || !paymentReference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("reference", paymentReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("RwandaPay complete: payment not found", reference, paymentError);
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (payment.user_id !== authData.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ success: true, status: "completed" });
    }

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/checkout/${reference}/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({
      status: "failed",
      success: false,
      message: "Invalid response from RwandaPay",
    }));

    const isSuccessful =
      data?.status === "successful" ||
      data?.data?.status === "successful" ||
      data?.success === true;

    if (!isSuccessful) {
      return NextResponse.json(
        { error: data.message || "Payment has not been completed" },
        { status: 400 }
      );
    }

    await completePayment(payment, reference, req.nextUrl.origin, data);

    return NextResponse.json({ success: true, status: "completed" });
  } catch (error: any) {
    console.error("RwandaPay complete route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
