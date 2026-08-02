import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const authUser = (users || []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("verification_code, verification_code_expires_at")
      .eq("id", authUser.id)
      .single();

    if (profileError) throw profileError;
    if (!profile?.verification_code) {
      return NextResponse.json({ error: "No active verification code" }, { status: 400 });
    }

    const expiresAt = new Date(profile.verification_code_expires_at as string);
    if (isNaN(expiresAt.getTime()) || new Date() > expiresAt) {
      return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
    }

    if (profile.verification_code !== hashOtp(code)) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      email_confirm: true,
    });
    if (updateAuthError) throw updateAuthError;

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("users")
      .update({
        email_verified: true,
        verification_code: null,
        verification_code_expires_at: null,
        updated_at: now,
      })
      .eq("id", authUser.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: error.message || "Failed to verify OTP" }, { status: 500 });
  }
}
