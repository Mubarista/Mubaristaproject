import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import type { Payment, Invoice } from "@/types";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

export function buildInvoiceHtml(invoice: Invoice) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

  const itemsRows = invoice.items
    .map(
      (item, i) => `
    <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"}">
      <td style="padding:12px;border:1px solid #e5e7eb">${item.description}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:right">${invoice.currency} ${fmt(item.amount)}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;font-weight:600">${invoice.currency} ${fmt(item.amount * item.quantity)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${invoice.invoiceNumber}</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif">
        <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
          <div style="background:#111827;color:#ffffff;padding:32px">
            <h1 style="margin:0;font-size:24px">MUBARISTA</h1>
            <p style="margin:8px 0 0;color:#9ca3af">Professional Invoice</p>
          </div>
          <div style="padding:32px">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px">
              <div>
                <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase">Billed To</p>
                <p style="margin:4px 0 0;font-weight:600">${invoice.userName}</p>
                <p style="margin:0;color:#6b7280;font-size:14px">${invoice.userEmail}</p>
                <p style="margin:0;color:#6b7280;font-size:14px">${invoice.userCountry || ""}</p>
              </div>
              <div style="text-align:right">
                <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase">Invoice Number</p>
                <p style="margin:4px 0 0;font-weight:600;font-family:monospace">${invoice.invoiceNumber}</p>
                <p style="margin:12px 0 0;color:#6b7280;font-size:12px;text-transform:uppercase">Status</p>
                <p style="margin:4px 0 0;font-weight:600;text-transform:capitalize">${invoice.status}</p>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px">
              <div>
                <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase">Issued</p>
                <p style="margin:4px 0 0;font-weight:600">${invoice.issuedAt}</p>
              </div>
              <div>
                <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase">Due</p>
                <p style="margin:4px 0 0;font-weight:600">${invoice.dueAt}</p>
              </div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              <thead>
                <tr style="background:#111827;color:#ffffff">
                  <th style="padding:12px;border:1px solid #e5e7eb;text-align:left">Description</th>
                  <th style="padding:12px;border:1px solid #e5e7eb;text-align:center">Qty</th>
                  <th style="padding:12px;border:1px solid #e5e7eb;text-align:right">Unit</th>
                  <th style="padding:12px;border:1px solid #e5e7eb;text-align:right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
            <div style="margin-left:auto;max-width:240px">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb">
                <span style="color:#6b7280">Subtotal</span>
                <span style="font-weight:600">${invoice.currency} ${fmt(invoice.subtotal)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb">
                <span style="color:#6b7280">Tax</span>
                <span style="font-weight:600">${invoice.currency} ${fmt(invoice.tax)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:700">
                <span>Total</span>
                <span>${invoice.currency} ${fmt(invoice.total)}</span>
              </div>
            </div>
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:14px">
              <p>Thank you for your business.</p>
              <p style="margin:4px 0 0">mubarista@platform.com · MUBARISTA</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendInvoiceEmail(invoice: Invoice) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "mubarista@platform.com";

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured; invoice email not sent.");
    return { sent: false, error: "Email provider not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: invoice.userEmail,
        subject: `Your MUBARISTA Invoice ${invoice.invoiceNumber}`,
        html: buildInvoiceHtml(invoice),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Resend API error:", text);
      return { sent: false, error: text };
    }

    return { sent: true };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return { sent: false, error: String(error) };
  }
}

export async function createInvoiceFromPayment(payment: Payment) {
  const now = new Date();
  const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const invoice: Partial<Invoice> = {
    invoiceNumber: generateInvoiceNumber(),
    userId: payment.userId,
    userName: payment.userName,
    userEmail: payment.userEmail,
    userCountry: payment.userCountry,
    type: payment.type,
    description: payment.description,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status === "completed" ? "paid" : "pending",
    issuedAt: now.toISOString(),
    dueAt: formatDate(due),
    paidAt: payment.paidAt,
    paymentId: payment.id,
    subtotal: payment.amount,
    tax: 0,
    total: payment.amount,
    items: [{ description: payment.description, amount: payment.amount, quantity: 1 }],
  };

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .insert(keysToSnakeCase(invoice))
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice:", error);
    return null;
  }

  const created = mapKeysToCamelCase(data) as Invoice;
  await sendInvoiceEmail(created);
  return created;
}
