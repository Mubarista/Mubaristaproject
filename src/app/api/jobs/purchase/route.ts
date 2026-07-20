import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";
import { normalizePaymentMethod } from "@/lib/payment";
import { createInvoiceFromPayment } from "@/lib/invoice";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, userId, userName, userEmail, userCountry, method, amount, currency = "RWF" } = body;

    if (!jobId || !userId) {
      return NextResponse.json({ error: "Missing jobId or userId" }, { status: 400 });
    }

    const { data: job, error: jobError } = await supabaseAdmin.from("jobs").select("*").eq("id", jobId).single();
    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "not_available") {
      return NextResponse.json({ error: "This job is no longer available" }, { status: 400 });
    }

    const { data: soldCheck } = await supabaseAdmin
      .from("job_purchases")
      .select("id")
      .eq("job_id", jobId)
      .eq("status", "paid")
      .limit(1)
      .maybeSingle();
    if (soldCheck) {
      return NextResponse.json({ error: "This job has already been purchased" }, { status: 400 });
    }

    if (job.category !== "paid") {
      return NextResponse.json({ error: "This job does not require payment" }, { status: 400 });
    }

    const price = Number(job.price) || 0;
    const paid = Number(amount) || 0;
    if (paid < price) {
      return NextResponse.json({ error: `Payment amount must be at least ${price}` }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("job_purchases")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ success: true, alreadyPurchased: true });
    }

    const now = new Date().toISOString();
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("job_purchases")
      .insert({
        job_id: jobId,
        user_id: userId,
        status: "paid",
        created_at: now,
        updated_at: now,
        paid_at: now,
      })
      .select()
      .single();
    if (purchaseError) throw purchaseError;

    const normalizedMethod = normalizePaymentMethod(method);
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        user_name: userName || "",
        user_email: userEmail || "",
        user_country: userCountry || "",
        type: "job_access",
        description: `Job access: ${job.title || ""}`,
        amount: paid,
        currency: currency || "RWF",
        status: "completed",
        method: normalizedMethod,
        reference: jobId,
        competition_id: "",
        competition_title: "",
        paid_at: now,
        created_at: now,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error inserting payment record:", paymentError);
    } else if (paymentData) {
      const payment = mapKeysToCamelCase(paymentData);
      createInvoiceFromPayment(payment).catch((err: any) => {
        console.error("Failed to create invoice from payment:", err);
      });
    }

    return NextResponse.json({ success: true, purchase: mapKeysToCamelCase(purchase) });
  } catch (error) {
    console.error("Error purchasing job access:", error);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
}
