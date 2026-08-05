import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("Error fetching user for reset:", userError);
      return NextResponse.json({ success: true });
    }

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") || "https://mubarista.com";
    const redirectTo = `${baseUrl}/reset-password`;

    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error("Error generating reset link:", linkError);
      return NextResponse.json({ success: true });
    }

    const { sent, error: sendError } = await sendEmail({
      to: email,
      subject: "Reset your MUBARISTA HUB LTD password",
      fromName: "MUBARISTA HUB LTD",
      templateId: "password-reset",
      templateData: {
        FULL_NAME: user.name || "User",
        RESET_LINK: data.properties.action_link,
      },
    });

    if (sendError) {
      console.error("Error sending password reset email:", sendError);
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ success: true });
  }
}
