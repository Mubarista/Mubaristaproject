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

  return sendEmail({
    to,
    subject: "Payment failed",
    fromName: "MUBARISTA HUB LTD",
    fromEmail: "team@mubarista.com",
    templateId: "payment-failed",
    templateData: {
      NAME: name,
      AMOUNT: amount,
      CURRENCY: currency,
      REFERENCE: reference,
      PROVIDER: provider || "",
      SITE_URL: siteUrl,
    },
  });
}

export interface SendBookDeliveryEmailInput {
  to: string;
  customerName: string;
  orderId: string;
  books: { title: string; pdfUrl: string }[];
}

export async function sendBookDeliveryEmail(input: SendBookDeliveryEmailInput): Promise<SendEmailResult> {
  const { to, customerName, orderId, books } = input;
  const supportEmail = process.env.SUPPORT_EMAIL || "hello@mubarista.com";
  const logoUrl = await getSiteLogo();

  const bookListHtml = books
    .map(
      (book) => `
        <tr>
          <td style="padding:12px;border:1px solid #e5e7eb;font-size:14px;color:#111827;font-family:Arial,Helvetica,sans-serif;">
            ${book.title}
          </td>
          <td style="padding:12px;border:1px solid #e5e7eb;text-align:center;">
            <a
              href="${book.pdfUrl}"
              target="_blank"
              download
              style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-family:Arial,Helvetica,sans-serif;font-weight:600;"
            >Download PDF</a>
          </td>
        </tr>
      `
    )
    .join("");

  return sendEmail({
    to,
    subject: "Your Mubarista Ebooks are ready for download",
    fromName: "MUBARISTA HUB LTD",
    fromEmail: process.env.RESEND_FROM_EMAIL || "hello@mubarista.com",
    templateId: "ebook-delivery",
    templateData: {
      LOGO_URL: logoUrl || "",
      CUSTOMER_NAME: customerName || "Reader",
      ORDER_ID: orderId,
      BOOK_LIST: bookListHtml,
      SUPPORT_EMAIL: supportEmail,
    },
  });
}

export interface SendJudgeAccessEmailInput {
  to: string;
  name: string;
  username: string;
  password: string;
  accessLink: string;
  competitionTitle?: string;
  expiresAt?: string | null;
}

export async function sendJudgeAccessEmail(
  input: SendJudgeAccessEmailInput
): Promise<SendEmailResult> {
  const { to, name, username, password, accessLink, competitionTitle, expiresAt } = input;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return sendEmail({
    to,
    subject: "Your Judge Access Link - MUBARISTA Competition",
    fromName: "MUBARISTA HUB LTD",
    fromEmail: "team@mubarista.com",
    templateId: "judge-access-link",
    templateData: {
      NAME: name,
      USERNAME: username,
      PASSWORD: password,
      ACCESS_LINK: accessLink,
      COMPETITION_TITLE: competitionTitle || "Competition",
      EXPIRES_AT: expiresAt || "No expiry",
      SITE_URL: siteUrl,
    },
  });
}
