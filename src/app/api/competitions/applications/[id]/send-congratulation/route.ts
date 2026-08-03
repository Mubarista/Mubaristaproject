import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, getSiteLogo } from "@/lib/email";

const ACCESS_LINK_VALID_DAYS = 3;
const DEFAULT_LOGO = "https://mubarista.com/logo-bimi.svg";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: app, error } = await supabaseAdmin
      .from("competition_applications")
      .select("id, user_email, full_name, access_link, access_link_expires_at, competition_id")
      .eq("id", id)
      .single();

    if (error || !app) {
      console.error("Application lookup error:", error);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!app.user_email) {
      return NextResponse.json({ error: "Applicant email is missing" }, { status: 400 });
    }

    if (!app.access_link) {
      return NextResponse.json({ error: "Access link not found. Nominate the applicant first." }, { status: 400 });
    }

    const { data: comp } = await supabaseAdmin
      .from("competitions")
      .select("title, entry_fee")
      .eq("id", app.competition_id)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const paymentUrl = `${baseUrl}/access/${app.access_link}`;
    const logoUrl = (await getSiteLogo()) || DEFAULT_LOGO;

    const { sent, error: sendError } = await sendEmail({
      to: app.user_email,
      subject: "Congratulations on your nomination",
      templateId: "competition-nomination",
      templateData: {
        LOGO_URL: logoUrl,
        FULL_NAME: app.full_name || "Participant",
        COMPETITION_TITLE: comp?.title || "a competition",
        ENTRY_FEE: String(comp?.entry_fee ?? 0),
        PAYMENT_LINK: paymentUrl,
        EXPIRES_DAYS: String(ACCESS_LINK_VALID_DAYS),
      },
    });

    if (!sent) {
      console.error("Failed to send congratulation email:", sendError);
      return NextResponse.json({ error: sendError || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending congratulation email:", error);
    return NextResponse.json({ error: "Failed to send congratulation email" }, { status: 500 });
  }
}
