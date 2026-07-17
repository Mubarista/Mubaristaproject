import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { createInvoiceFromPayment } from "@/lib/invoice";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    let query = supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    if (userEmail) query = query.eq('user_email', userEmail);

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
