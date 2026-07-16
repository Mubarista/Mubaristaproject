import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, method, accountDetails } = body;

    // Check wallet balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from("wallet_withdrawals")
      .insert({
        user_id: userId,
        amount,
        currency: wallet.currency,
        method,
        account_details: accountDetails,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (withdrawalError) throw withdrawalError;

    // Deduct from wallet
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id);

    if (updateError) throw updateError;

    return NextResponse.json(mapKeysToCamelCase(withdrawal));
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
