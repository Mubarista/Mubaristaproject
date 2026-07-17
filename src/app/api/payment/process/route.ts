import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";
import { createInvoiceFromPayment } from "@/lib/invoice";
import { normalizePaymentMethod } from "@/lib/payment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, method, amount, currency = "RWF" } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Fetch application details to link the payment record
    const { data: app, error: appError } = await supabase
      .from("competition_applications")
      .select("id, user_id, user_name, user_email, full_name, country, competition_id, payment_status")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Fetch the competition title for the admin payments view
    let competitionTitle = "";
    if (app.competition_id) {
      const { data: comp } = await supabase
        .from("competitions")
        .select("title")
        .eq("id", app.competition_id)
        .single();
      if (comp) competitionTitle = comp.title || "";
    }

    const { data, error } = await supabase
      .from("competition_applications")
      .update({
        payment_status: "paid",
        paid_at: now,
        updated_at: now,
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;

    // Insert a payment transaction record for the participant's history
    const normalizedMethod = normalizePaymentMethod(method);

    const { data: paymentData, error: paymentError } = await supabaseAdmin.from("payments").insert({
      user_id: app.user_id || app.id,
      user_name: app.user_name || app.full_name || "Participant",
      user_email: app.user_email || "",
      user_country: app.country || "",
      type: "competition_entry",
      description: "Competition entry fee",
      amount: amount || 0,
      currency: currency || "RWF",
      status: "completed",
      method: normalizedMethod,
      reference: applicationId,
      competition_id: app.competition_id || "",
      competition_title: competitionTitle || "",
      paid_at: now,
      created_at: now,
    }).select().single();

    if (paymentError) {
      console.error("Error inserting payment record:", paymentError);
    } else if (paymentData) {
      const payment = mapKeysToCamelCase(paymentData);
      createInvoiceFromPayment(payment).catch(err => {
        console.error("Failed to create invoice from payment:", err);
      });
    }

    return NextResponse.json({
      success: true,
      method: method || null,
      application: mapKeysToCamelCase(data),
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}
