import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { createInvoiceFromPayment } from "@/lib/invoice";
import { createNotification } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');
    const reference = searchParams.get('reference');

    let query = supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    if (userEmail) query = query.eq('user_email', userEmail);
    if (reference) query = query.eq('reference', reference);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const status = body.status || "pending";
    const paidAt = body.paidAt || (status === "completed" ? now : null);

    const { data, error } = await supabaseAdmin.from("payments").insert({
      ...keysToSnakeCase(body),
      status,
      created_at: now,
      paid_at: paidAt,
    }).select().single();
    if (error) throw error;

    const payment = mapKeysToCamelCase(data);
    createInvoiceFromPayment(payment).catch(err => {
      console.error("Failed to create invoice from payment:", err);
    });

    if (payment.userId) {
      const amountText = formatCurrency(payment.amount, payment.currency || "RWF");
      if (payment.type === "premium_subscription") {
        createNotification({
          userId: payment.userId,
          title: "Premium subscription active",
          description: `Your premium subscription is now active. You paid ${amountText}.`,
          type: "subscription",
          metadata: { reference: payment.reference },
        });
      } else if (payment.type === "competition_entry") {
        createNotification({
          userId: payment.userId,
          title: "Competition entry confirmed",
          description: `Your application fee has been received. You are now active in the competition.`,
          type: "competition",
          metadata: { reference: payment.reference },
        });
      } else if (payment.type === "tool_purchase" || payment.type === "book_purchase") {
        createNotification({
          userId: payment.userId,
          title: "Payment confirmed",
          description: `We received ${amountText} for your order. Your items are being processed.`,
          type: "order",
          metadata: { reference: payment.reference, description: payment.description },
        });
      } else {
        createNotification({
          userId: payment.userId,
          title: "Payment received",
          description: `We received ${amountText}. Reference: ${payment.reference}.`,
          type: "payment",
          metadata: { reference: payment.reference },
        });
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const now = new Date().toISOString();
    const status = updateData.status;
    const paidAt = status === "completed" ? (updateData.paidAt || now) : null;

    const { data, error } = await supabaseAdmin
      .from("payments")
      .update({
        ...keysToSnakeCase(updateData),
        paid_at: paidAt,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clear = searchParams.get('clear');

    if (clear === 'all') {
      const { error } = await supabaseAdmin
        .from("payments")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      return NextResponse.json({ success: true, cleared: true });
    }

    if (!id) return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("payments").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
