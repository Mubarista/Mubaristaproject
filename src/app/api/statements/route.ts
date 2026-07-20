import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import type { PaymentType, MonthlyStatement } from "@/types";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function buildGeneratedStatements(payments: Record<string, unknown>[]): MonthlyStatement[] {
  const grouped = new Map<string, MonthlyStatement>();

  for (const p of payments) {
    const payment = mapKeysToCamelCase(p);
    const date = new Date(payment.createdAt || payment.paidAt || payment.created_at || Date.now());
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const month = monthNames[monthIndex];
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        period: `${month} ${year}`,
        month,
        year,
        currency: "RWF",
        totalRevenue: 0,
        totalRefunds: 0,
        netRevenue: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        byType: {
          competition_entry: 0,
          premium_subscription: 0,
          book_purchase: 0,
          tool_purchase: 0,
          job_access: 0,
          refund: 0,
        },
      });
    }

    const statement = grouped.get(key)!;
    const amount = Number(payment.amount || 0);
    const type = payment.type as PaymentType;
    const isRefund = type === "refund";
    const isCompleted = payment.status === "completed";

    if (!isCompleted) continue;

    if (isRefund) {
      statement.totalRefunds += amount;
      statement.netRevenue -= amount;
      statement.totalExpenses = statement.totalRefunds;
      statement.netBalance = statement.netRevenue;
    } else {
      statement.totalRevenue += amount;
      statement.netRevenue += amount;
      statement.totalIncome = statement.totalRevenue;
      statement.netBalance = statement.netRevenue;
      statement.transactionCount += 1;
    }

    if (type && statement.byType) {
      statement.byType[type] = (statement.byType[type] || 0) + (isRefund ? -amount : amount);
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return monthNames.indexOf(a.month || "") - monthNames.indexOf(b.month || "");
  });
}

export async function GET() {
  try {
    const { data: stored, error: storedError } = await supabaseAdmin.from("statements").select("*").order("created_at", { ascending: false });
    if (storedError) throw storedError;

    if (stored && stored.length > 0) {
      return NextResponse.json(mapKeysToCamelCase(stored) || []);
    }

    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (paymentsError) throw paymentsError;

    return NextResponse.json(buildGeneratedStatements(payments || []));
  } catch (error) {
    console.error("Error fetching statements:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("statements").insert({
      ...keysToSnakeCase(body),
      created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating statement:", error);
    return NextResponse.json({ error: "Failed to create statement" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const { data, error } = await supabaseAdmin.from("statements").update({
      ...keysToSnakeCase(updateData),
      updated_at: new Date().toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating statement:", error);
    return NextResponse.json({ error: "Failed to update statement" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing statement ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("statements").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting statement:", error);
    return NextResponse.json({ error: "Failed to delete statement" }, { status: 500 });
  }
}
