import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function fetchUserData(table: string, userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("user_id", userId);
    if (error) {
      console.warn(`Skipping ${table} export:`, error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn(`Skipping ${table} export:`, err.message);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile for export:", profileError);
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    const [
      addresses,
      applications,
      payments,
      invoices,
      jobPurchases,
      wishlists,
      toolReviews,
      messages,
      notifications,
      wallets,
      walletWithdrawals,
    ] = await Promise.all([
      fetchUserData("addresses", userId),
      fetchUserData("competition_applications", userId),
      fetchUserData("payments", userId),
      fetchUserData("invoices", userId),
      fetchUserData("job_purchases", userId),
      fetchUserData("wishlists", userId),
      fetchUserData("tool_reviews", userId),
      fetchUserData("messages", userId),
      fetchUserData("notifications", userId),
      fetchUserData("wallets", userId),
      fetchUserData("wallet_withdrawals", userId),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: profile || null,
      addresses,
      competitionApplications: applications,
      payments,
      invoices,
      jobPurchases,
      wishlists,
      toolReviews,
      messages,
      notifications,
      wallets,
      walletWithdrawals,
    };

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error("Error exporting user data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
