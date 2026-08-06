import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { sendEmail, buildEmailHtml, getSiteLogo } from "@/lib/email";
import type { Payment, Invoice } from "@/types";

const DEFAULT_LOGO = "https://www.mubarista.com/logo-bimi.svg";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

export async function buildInvoiceHtml(invoice: Invoice) {


  const itemsRows = invoice.items
    .map(
      (item, i) => `
    <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"}">
      <td style="padding:12px;border:1px solid #e5e7eb">${item.description}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:right">${invoice.currency} ${formatNumber(item.amount)}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;font-weight:600">${invoice.currency} ${formatNumber(item.amount * item.quantity)}</td>
    </tr>
  `
    )
    .join("");

  const body = `
    <h2 style="margin:0 0 24px;color:#9ca3af;font-size:16px;font-weight:400;">Professional Invoice</h2>
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
        <span style="font-weight:600">${invoice.currency} ${formatNumber(invoice.subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb">
        <span style="color:#6b7280">Tax</span>
        <span style="font-weight:600">${invoice.currency} ${formatNumber(invoice.tax)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:700">
        <span>Total</span>
        <span>${invoice.currency} ${formatNumber(invoice.total)}</span>
      </div>
    </div>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:14px">
      <p>Thank you for your business.</p>
      <p style="margin:4px 0 0">mubarista@platform.com · MUBARISTA</p>
    </div>
  `;

  return buildEmailHtml({
    title: `Invoice ${invoice.invoiceNumber}`,
    body,
  });
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function formatInvoiceDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function formatInvoiceTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
}

const paymentMethodLabels: Record<string, string> = {
  card: "Credit / Debit Card",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
  paypal: "PayPal",
};

export async function sendInvoiceEmail(invoice: Invoice, paymentMethod?: string) {
  const logoUrl = (await getSiteLogo()) || DEFAULT_LOGO;

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("phone")
    .eq("id", invoice.userId)
    .maybeSingle();

  const phone = profile?.phone || "—";

  const itemsRows = invoice.items
    .map(
      (item, i) => `
    <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};">
      <td style="padding:12px;border:1px solid #e5e7eb;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${item.description}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:center;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${item.quantity}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${invoice.currency} ${formatNumber(item.amount)}</td>
      <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;font-weight:600;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${invoice.currency} ${formatNumber(item.amount * item.quantity)}</td>
    </tr>
  `
    )
    .join("");

  const methodLabel = paymentMethod
    ? (paymentMethodLabels[paymentMethod] || paymentMethod.replace(/_/g, " "))
    : "—";

  const result = await sendEmail({
    to: invoice.userEmail,
    subject: `Your MUBARISTA Invoice ${invoice.invoiceNumber}`,
    fromName: "MUBARISTA HUB LTD",
    fromEmail: "customer@mubarista.com",
    templateId: "invoice",
    templateData: {
      LOGO_URL: logoUrl,
      FULL_NAME: invoice.userName,
      BILLING_EMAIL: invoice.userEmail,
      BILLING_PHONE: phone,
      BILLING_ADDRESS: invoice.userCountry || "—",
      INVOICE_NUMBER: invoice.invoiceNumber,
      ISSUED_DATE: formatInvoiceDate(invoice.issuedAt),
      ISSUED_TIME: formatInvoiceTime(invoice.issuedAt),
      DUE_DATE: formatInvoiceDate(invoice.dueAt),
      DUE_TIME: formatInvoiceTime(invoice.dueAt),
      PAID_DATE: formatInvoiceDate(invoice.paidAt),
      PAID_TIME: formatInvoiceTime(invoice.paidAt),
      PAYMENT_METHOD: methodLabel,
      INVOICE_STATUS: invoice.status,
      ITEMS: itemsRows,
      INVOICE_SUBTOTAL: formatNumber(invoice.subtotal),
      INVOICE_TAX: formatNumber(invoice.tax),
      INVOICE_TOTAL: formatNumber(invoice.total),
      INVOICE_CURRENCY: invoice.currency,
      PDF_URL: `https://www.mubarista.com/api/invoices/${encodeURIComponent(invoice.invoiceNumber)}/pdf`,
      CONTACT_EMAIL: "customer@mubarista.com",
    },
  });

  if (!result.sent) {
    console.error(`Failed to send invoice email for ${invoice.invoiceNumber}:`, result.error);
  } else {
    console.log(`Invoice email sent for ${invoice.invoiceNumber}`);
  }

  return result;
}

export async function createInvoiceFromPayment(payment: Payment) {
  // Prevent duplicate invoices if the payment has already been invoiced
  const { data: existing } = await supabaseAdmin
    .from("invoices")
    .select("id")
    .eq("payment_id", payment.id)
    .maybeSingle();
  if (existing) {
    return mapKeysToCamelCase(existing) as Invoice;
  }

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
  await sendInvoiceEmail(created, payment.method);
  return created;
}
