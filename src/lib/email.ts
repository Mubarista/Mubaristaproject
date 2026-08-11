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
  html?: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  templateId?: string;
  templateData?: Record<string, string | number | boolean>;
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

  if (input.templateId) {
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
          template: {
            id: input.templateId,
            variables: input.templateData || {},
          },
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

  if (!input.html) {
    return { sent: false, error: "No email content provided" };
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

export async function sendBatchWithResend(
  inputs: SendEmailInput[]
): Promise<{ sent: number; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "mubarista@platform.com";

  if (!resendApiKey) {
    return { sent: 0, error: "No email provider configured" };
  }

  if (inputs.length === 0) {
    return { sent: 0 };
  }

  const payloads = inputs.map((input) => {
    const payload: any = {
      from: `"${input.fromName || "MUBARISTA"}" <${input.fromEmail || fromEmail}>`,
      to: input.to,
      subject: input.subject,
    };
    if (input.templateId) {
      payload.template = {
        id: input.templateId,
        variables: input.templateData || {},
      };
    } else if (input.html) {
      payload.html = input.html;
      if (input.text) payload.text = input.text;
    }
    return payload;
  });

  const BATCH_SIZE = 100;
  let sent = 0;
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const chunk = payloads.slice(i, i + BATCH_SIZE);
    try {
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Resend batch API error:", text);
        return { sent, error: text };
      }
      sent += chunk.length;
    } catch (error) {
      console.error("Resend batch send error:", error);
      return { sent, error: String(error) };
    }
  }

  return { sent };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (input.templateId) {
    return sendWithResend(input);
  }
  const settings = await getSmtpSettings();
  if (settings) {
    return sendWithSmtp(settings, input);
  }
  return sendWithResend(input);
}

export interface SendPaymentFailedEmailInput {
  to: string;
  name?: string;
  amount: number;
  currency: string;
  reference: string;
  provider?: string;
}

export async function sendPaymentFailedEmail(
  input: SendPaymentFailedEmailInput
): Promise<SendEmailResult> {
  const { to, name = "there", amount, currency, reference, provider } = input;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const logoUrl = await getSiteLogo();

  const body = `
    <p style="margin: 0 0 16px; color: #374151;">Hi ${name},</p>
    <p style="margin: 0 0 16px; color: #374151;">
      We were unable to complete your payment of <strong style="color: #111827;">${amount} ${currency}</strong>
      for reference <strong style="color: #111827;">${reference}</strong>.
    </p>
    ${provider ? `<p style="margin: 0 0 16px; color: #374151;">Payment provider: <strong style="color: #111827;">${provider}</strong></p>` : ""}
    <p style="margin: 0 0 24px; color: #374151;">
      This may have been due to an issue with your card, insufficient funds, or a network error.
      No money has been deducted. You can try again using the same or a different payment method.
    </p>
    <p style="margin: 0 0 24px; color: #374151;">
      If you keep seeing this, please contact our support team for help.
    </p>
    <p style="text-align: center; margin: 32px 0;">
      <a
        href="${siteUrl}/competitions"
        style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;"
      >
        Try again
      </a>
    </p>
  `;

  const html = await buildEmailHtml({ title: "Payment failed", body, logoUrl });

  return sendEmail({
    to,
    subject: "Payment failed",
    fromName: "MUBARISTA HUB LTD",
    fromEmail: "team@mubarista.com",
    html,
  });
}
