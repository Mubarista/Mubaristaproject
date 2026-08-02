import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { completePayment } from "@/lib/rwandapay";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tx_ref, status, transaction_id } = body;

    if (!tx_ref) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("reference", tx_ref)
      .maybeSingle();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ success: true, status: "completed", already: true });
    }

    const isSuccess =
      String(status).toLowerCase() === "successful" ||
      String(status).toLowerCase() === "success";

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (!isSuccess) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", paid_at: null })
        .eq("id", payment.id);
      return NextResponse.json({ success: true, status: "failed" });
    }

    await completePayment(payment, transaction_id || tx_ref, origin);

    return NextResponse.json({ success: true, status: "completed" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
