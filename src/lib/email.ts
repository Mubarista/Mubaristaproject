import { createTransport, Transporter } from "nodemailer";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface SendEmailResult {
  sent: boolean;
  error?: string;
}

async function loadSmtpSettingsFromDb(): Promise<SmtpSettings | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("smtp_settings")
      .select("host, port, secure, username, from_email, from_name")
      .eq("enabled", true)
      .limit(1)
      .single();
    if (error || !data) return null;
    return {
      host: data.host,
      port: data.port,
      secure: data.secure,
      username: data.username,
      fromEmail: data.from_email,
      fromName: data.from_name,
    };
  } catch (err) {
    console.error("Error loading SMTP settings from DB:", err);
    return null;
  }
}

function loadSmtpSettingsFromEnv(): SmtpSettings | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME || "MUBARISTA";
  if (!host || !port || !username || !password || !fromEmail) return null;
  return {
    host,
    port: parseInt(port, 10),
    secure: process.env.SMTP_SECURE === "true",
    username,
    fromEmail,
    fromName,
  };
}

export async function getSmtpSettings(): Promise<SmtpSettings | null> {
  const db = await loadSmtpSettingsFromDb();
  return db || loadSmtpSettingsFromEnv();
}

async function sendWithSmtp(
  settings: SmtpSettings,
  input: SendEmailInput
): Promise<SendEmailResult> {
  const password = process.env.SMTP_PASSWORD;
  if (!password) {
    return { sent: false, error: "SMTP password not configured" };
  }

  const transporter: Transporter = createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.username,
      pass: password,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${input.fromName || settings.fromName}" <${input.fromEmail || settings.fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { sent: true };
  } catch (error) {
    console.error("SMTP send error:", error);
    return { sent: false, error: String(error) };
  }
}

async function sendWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = input.fromEmail || process.env.RESEND_FROM_EMAIL || "mubarista@platform.com";

  if (!resendApiKey) {
    return { sent: false, error: "No email provider configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `"${input.fromName || "MUBARISTA"}" <${fromEmail}>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Resend API error:", text);
      return { sent: false, error: text };
    }

    return { sent: true };
  } catch (error) {
    console.error("Resend send error:", error);
    return { sent: false, error: String(error) };
  }
}

export async function getSiteLogo(): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("logo")
      .limit(1)
      .maybeSingle();
    const configured = !error && data?.logo ? (data.logo as string) : null;
    if (configured) return configured;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    return siteUrl ? `${siteUrl}/logo-bimi.svg` : null;
  } catch (err) {
    console.error("Error loading site logo:", err);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    return siteUrl ? `${siteUrl}/logo-bimi.svg` : null;
  }
}

export interface BuildEmailHtmlInput {
  title?: string;
  body: string;
  logoUrl?: string | null;
}

export async function buildEmailHtml(input: BuildEmailHtmlInput): Promise<string> {
  const logoUrl = input.logoUrl ?? (await getSiteLogo());
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="MUBARISTA" style="max-height:48px;max-width:180px;" />`
    : `<h1 style="margin:0;font-size:24px;">MUBARISTA</h1>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${input.title ?? "MUBARISTA"}</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif">
        <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
          <div style="background:#111827;color:#ffffff;padding:24px 32px;text-align:center;">
            ${logoHtml}
          </div>
          <div style="padding:32px;">
            ${input.body}
          </div>
          <div style="padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:14px">
            <p style="margin:0;">MUBARISTA</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const settings = await getSmtpSettings();
  if (settings) {
    const smtp = await sendWithSmtp(settings, input);
    if (smtp.sent) return smtp;
    console.warn("SMTP failed, falling back to Resend:", smtp.error);
  }
  return sendWithResend(input);
}
