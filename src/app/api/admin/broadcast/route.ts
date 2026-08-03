import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendBatchWithResend, getSiteLogo } from "@/lib/email";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

const DEFAULT_LOGO = "https://mubarista.com/logo-bimi.svg";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching broadcast history:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    return NextResponse.json((data || []).map(mapKeysToCamelCase));
  } catch (error) {
    console.error("Error in broadcast history API:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, message, audience = "all", ctaUrl = "https://mubarista.com", ctaText = "Visit MUBARISTA" } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    if (!["all", "subscribers", "verified"].includes(audience)) {
      return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("users")
      .select("email, name")
      .not("email", "is", null)
      .not("email", "eq", "");

    if (audience === "subscribers") {
      query = query.eq("subscribed", true);
    } else if (audience === "verified") {
      query = query.eq("email_verified", true);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("Error fetching broadcast recipients:", error);
      return NextResponse.json({ error: "Failed to fetch recipients" }, { status: 500 });
    }

    const recipients = (users || []).filter((u: any) => u.email);
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    const logoUrl = (await getSiteLogo()) || DEFAULT_LOGO;

    const inputs = recipients.map((user: any) => ({
      to: user.email,
      subject,
      templateId: "broadcast" as const,
      templateData: {
        LOGO_URL: logoUrl,
        TITLE: subject,
        MESSAGE: message,
        CTA_URL: ctaUrl,
        CTA_TEXT: ctaText,
      },
    }));

    const { sent, error: sendError } = await sendBatchWithResend(inputs);

    if (sendError) {
      console.error("Broadcast send error:", sendError);
      return NextResponse.json({ error: sendError, sent }, { status: 500 });
    }

    await supabaseAdmin.from("broadcasts").insert({
      subject,
      message,
      audience,
      cta_url: ctaUrl,
      cta_text: ctaText,
      sent_count: sent,
      total: recipients.length,
    });

    return NextResponse.json({ sent, total: recipients.length });
  } catch (error) {
    console.error("Error in broadcast API:", error);
    return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
  }
}
