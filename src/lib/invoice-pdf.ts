import { PDFDocument, rgb } from "pdf-lib";
import type { Invoice } from "@/types";

const paymentMethodLabels: Record<string, string> = {
  card: "Credit / Debit Card",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
  paypal: "PayPal",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function fmtDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function fmtTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
}

export async function buildInvoicePdfBuffer(invoice: Invoice, phone?: string | null, paymentMethod?: string | null): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont("Helvetica-Bold");
  const normal = await pdfDoc.embedFont("Helvetica");

  const m = paymentMethod
    ? (paymentMethodLabels[paymentMethod] || paymentMethod.replace(/_/g, " "))
    : "—";

  // Header
  page.drawText("MUBARISTA HUB LTD", { x: 50, y: height - 60, size: 22, font: bold, color: rgb(0.07, 0.08, 0.1) });
  page.drawText("INVOICE", { x: 50, y: height - 95, size: 26, font: bold, color: rgb(0.07, 0.08, 0.1) });
  page.drawText(`Invoice #: ${invoice.invoiceNumber}`, { x: 50, y: height - 125, size: 11, font: normal, color: rgb(0.42, 0.45, 0.5) });

  // Invoice details (right)
  const rightX = 360;
  let rightY = height - 60;
  page.drawText("Invoice Details", { x: rightX, y: rightY, size: 11, font: bold, color: rgb(0.07, 0.08, 0.1) });
  rightY -= 18;
  page.drawText(`Issued: ${fmtDate(invoice.issuedAt)} at ${fmtTime(invoice.issuedAt)}`, { x: rightX, y: rightY, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });
  rightY -= 15;
  page.drawText(`Due: ${fmtDate(invoice.dueAt)} at ${fmtTime(invoice.dueAt)}`, { x: rightX, y: rightY, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });
  rightY -= 15;
  page.drawText(`Paid: ${fmtDate(invoice.paidAt)} at ${fmtTime(invoice.paidAt)}`, { x: rightX, y: rightY, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });
  rightY -= 15;
  page.drawText(`Payment method: ${m}`, { x: rightX, y: rightY, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });
  rightY -= 15;
  page.drawText(`Status: ${invoice.status.toUpperCase()}`, { x: rightX, y: rightY, size: 10, font: bold, color: rgb(0.18, 0.49, 0.98) });

  // Billed to
  let y = height - 190;
  page.drawText("Billed To", { x: 50, y, size: 12, font: bold, color: rgb(0.07, 0.08, 0.1) });
  y -= 20;
  page.drawText(invoice.userName, { x: 50, y, size: 11, font: bold, color: rgb(0.07, 0.08, 0.1) });
  y -= 16;
  page.drawText(invoice.userEmail, { x: 50, y, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });
  y -= 15;
  page.drawText(phone || "—", { x: 50, y, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });
  y -= 15;
  page.drawText(invoice.userCountry || "—", { x: 50, y, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });

  // Items table header
  y = height - 310;
  page.drawRectangle({ x: 50, y: y - 5, width: 512, height: 22, color: rgb(0.07, 0.08, 0.1) });
  page.drawText("Description", { x: 60, y: y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Qty", { x: 320, y: y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Unit", { x: 380, y: y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Total", { x: 470, y: y, size: 10, font: bold, color: rgb(1, 1, 1) });

  // Items rows
  y -= 24;
  invoice.items.forEach((item, i) => {
    if (y < 220) {
      page = pdfDoc.addPage([612, 792]);
      y = height - 60;
    }
    if (i % 2 === 0) {
      page.drawRectangle({ x: 50, y: y - 4, width: 512, height: 18, color: rgb(0.96, 0.97, 0.98) });
    }
    page.drawText(item.description, { x: 60, y, size: 9, font: normal, color: rgb(0.07, 0.08, 0.1), maxWidth: 240 });
    page.drawText(String(item.quantity), { x: 320, y, size: 9, font: normal, color: rgb(0.07, 0.08, 0.1) });
    page.drawText(`${invoice.currency} ${fmt(item.amount)}`, { x: 380, y, size: 9, font: normal, color: rgb(0.07, 0.08, 0.1) });
    page.drawText(`${invoice.currency} ${fmt(item.amount * item.quantity)}`, { x: 470, y, size: 9, font: normal, color: rgb(0.07, 0.08, 0.1) });
    y -= 18;
  });

  // Totals
  y -= 20;
  page.drawText("Subtotal", { x: 350, y, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });
  page.drawText(`${invoice.currency} ${fmt(invoice.subtotal)}`, { x: 470, y, size: 10, font: normal, color: rgb(0.07, 0.08, 0.1) });
  y -= 16;
  page.drawText("Tax", { x: 350, y, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5) });
  page.drawText(`${invoice.currency} ${fmt(invoice.tax)}`, { x: 470, y, size: 10, font: normal, color: rgb(0.07, 0.08, 0.1) });
  y -= 22;
  page.drawText("Total", { x: 350, y, size: 12, font: bold, color: rgb(0.07, 0.08, 0.1) });
  page.drawText(`${invoice.currency} ${fmt(invoice.total)}`, { x: 470, y, size: 12, font: bold, color: rgb(0.07, 0.08, 0.1) });

  // Footer
  y -= 60;
  page.drawText("Thank you for your business", { x: 50, y, size: 12, font: bold, color: rgb(0.07, 0.08, 0.1) });
  y -= 20;
  page.drawText("If you have any questions or concerns about this invoice, please contact our Customer Care team:", {
    x: 50, y, size: 10, font: normal, color: rgb(0.42, 0.45, 0.5), maxWidth: 512,
  });
  y -= 30;
  page.drawText("customer@mubarista.com", { x: 50, y, size: 10, font: bold, color: rgb(0.18, 0.49, 0.98) });
  y -= 40;
  page.drawText("© 2026 MUBARISTA HUB LTD. All rights reserved.", { x: 50, y, size: 9, font: normal, color: rgb(0.42, 0.45, 0.5) });

  return pdfDoc.save();
}
