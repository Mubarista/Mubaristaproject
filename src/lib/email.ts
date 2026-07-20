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

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const settings = await getSmtpSettings();
  if (settings) {
    return sendWithSmtp(settings, input);
  }
  return sendWithResend(input);
}
