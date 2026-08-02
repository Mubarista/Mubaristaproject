import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildEmailHtml, sendEmail } from "@/lib/email";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const authUser = (users || []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const otp = generateOtp();
    const hashed = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await supabaseAdmin.from("users").upsert({
      id: authUser.id,
      email,
      verification_code: hashed,
      verification_code_expires_at: expiresAt,
      updated_at: now,
    }, { onConflict: "id" });

    const html = await buildEmailHtml({
      title: "Verify your MUBARISTA account",
      body: `
        <p style="text-align:center;">Your verification code is:</p>
        <p style="font-size:32px;letter-spacing:4px;font-weight:700;text-align:center;color:#2563eb;margin:24px 0;">${otp}</p>
        <p style="text-align:center;color:#6b7280;">This code expires in 10 minutes.</p>
      `,
    });

    const result = await sendEmail({
      to: email,
      subject: "Your MUBARISTA verification code",
      html,
    });

    if (!result.sent) {
      throw new Error(result.error || "Failed to send email");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}
