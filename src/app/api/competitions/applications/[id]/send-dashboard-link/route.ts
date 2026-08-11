import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, getSiteLogo } from "@/lib/email";

const DASHBOARD_LINK_VALID_DAYS = 7;
const DEFAULT_LOGO = "https://mubarista.com/logo-bimi.svg";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: app, error } = await supabaseAdmin
      .from("competition_applications")
      .select("id, user_email, full_name, payment_status, competition_id")
      .eq("id", id)
      .single();

    if (error || !app) {
      console.error("Application lookup error:", error);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!app.user_email) {
      return NextResponse.json({ error: "Applicant email is missing" }, { status: 400 });
    }

    if (app.payment_status !== "paid" && app.payment_status !== "completed") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 403 });
    }

    const now = new Date();
    const token = randomUUID().replace(/-/g, "");
    const expiresAt = new Date(
      now.getTime() + DASHBOARD_LINK_VALID_DAYS * 24 * 60 * 60 * 1000
    );

    await supabaseAdmin
      .from("competition_applications")
      .update({
        access_link: token,
        access_link_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", id);

    const { data: comp } = await supabaseAdmin
      .from("competitions")
      .select("title")
      .eq("id", app.competition_id)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const dashboardUrl = `${baseUrl}/dashboard/participant?token=${token}`;
    const logoUrl = (await getSiteLogo()) || DEFAULT_LOGO;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${logoUrl}" alt="MUBARISTA" style="height: 48px;" />
        </div>
        <h2 style="color: #111;">Your competition dashboard is ready</h2>
        <p>Hi ${app.full_name || "Participant"},</p>
        <p>
          Your payment for <strong>${comp?.title || "the competition"}</strong> has been received.
          You can now access your live participant dashboard using the link below.
        </p>
        <p style="margin: 24px 0; text-align: center;">
          <a
            href="${dashboardUrl}"
            style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;"
          >
            Go to Participant Dashboard
          </a>
        </p>
        <p style="font-size: 13px; color: #666;">
          This link will expire in ${DASHBOARD_LINK_VALID_DAYS} days. Do not share it with anyone.
        </p>
        <p style="font-size: 13px; color: #666;">
          If the button does not work, copy and paste this URL into your browser:<br/>
          ${dashboardUrl}
        </p>
      </div>
    `;

    const { sent, error: sendError } = await sendEmail({
      to: app.user_email,
      subject: `Your ${comp?.title || "competition"} participant dashboard is ready`,
      fromName: "MUBARISTA HUB LTD",
      fromEmail: "team@mubarista.com",
      html,
    });

    if (!sent) {
      console.error("Failed to send dashboard email:", sendError);
      return NextResponse.json({ error: sendError || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, dashboardUrl });
  } catch (error) {
    console.error("Error sending dashboard link:", error);
    return NextResponse.json({ error: "Failed to send dashboard link" }, { status: 500 });
  }
}
