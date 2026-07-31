import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const USER_DATA_TABLES = [
  "addresses",
  "competition_applications",
  "contact_messages",
  "invoices",
  "job_purchases",
  "latte_art_comments",
  "notifications",
  "payments",
  "statements",
  "tool_reviews",
  "wallet_withdrawals",
  "wallets",
];

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const user = authData.user;
  let firstName = "";
  try {
    const body = await req.json();
    firstName = String(body.firstName || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Delete account profile load error:", profileError);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  const fullName = profile?.name || user.user_metadata?.name || "";
  const expectedFirstName = fullName.trim().split(/\s+/)[0].toLowerCase();

  if (!firstName || firstName !== expectedFirstName) {
    return NextResponse.json(
      { error: "First name does not match. Please type your first name exactly as it appears on your account." },
      { status: 400 }
    );
  }

  for (const table of USER_DATA_TABLES) {
    const { error } = await supabaseAdmin.from(table).delete().eq("user_id", user.id);
    if (error) {
      console.error(`Delete account: failed to delete from ${table}:`, error);
    }
  }

  const { error: deleteProfileError } = await supabaseAdmin.from("users").delete().eq("id", user.id);
  if (deleteProfileError) {
    console.error("Delete account: failed to delete users row:", deleteProfileError);
  }

  const { error: recordError } = await supabaseAdmin.from("deleted_accounts").insert({
    user_id: user.id,
    email: user.email,
    phone: profile?.phone || user.user_metadata?.phone || "",
    deleted_at: new Date().toISOString(),
  });

  if (recordError) {
    console.error("Delete account: failed to record deletion:", recordError);
  }

  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (deleteAuthError) {
    console.error("Delete account: failed to delete auth user:", deleteAuthError);
    return NextResponse.json({ error: "Failed to delete auth user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
