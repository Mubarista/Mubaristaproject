import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, getSiteLogo } from "@/lib/email";

const DEFAULT_LOGO = "https://www.mubarista.com/logo-bimi.svg";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user for password changed:", error);
    }

    const logoUrl = (await getSiteLogo()) || DEFAULT_LOGO;
    const changedAt = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const email = authData.user.email;
    if (!email) {
      return NextResponse.json({ success: true });
    }

    const { sent, error: sendError } = await sendEmail({
      to: email,
      subject: "Your MUBARISTA HUB LTD password has been changed",
      fromName: "MUBARISTA HUB LTD",
      fromEmail: "support@mubarista.com",
      templateId: "password-changed",
      templateData: {
        LOGO_URL: logoUrl,
        FULL_NAME: user?.name || authData.user.user_metadata?.name || "User",
        CHANGED_AT: changedAt,
      },
    });

    if (sendError) {
      console.error("Error sending password changed email:", sendError);
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Notify password changed API error:", error);
    return NextResponse.json({ success: true });
  }
}
