import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";
import { buildInvoicePdfBuffer } from "@/lib/invoice-pdf";
import type { Invoice } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params;

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Invoice number is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("invoice_number", decodeURIComponent(invoiceNumber))
      .single();

    if (error || !data) {
      console.error("Invoice PDF fetch error:", error);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = mapKeysToCamelCase(data) as Invoice;

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("phone")
      .eq("id", invoice.userId)
      .maybeSingle();

    const pdfBuffer = await buildInvoicePdfBuffer(invoice, profile?.phone);

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Mubarista-Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
