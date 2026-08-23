import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendBookDeliveryEmail } from "@/lib/email";

interface DeliveryRequest {
  bookIds: string[];
  email: string;
  customerName: string;
  orderId: string;
}

export async function POST(request: Request) {
  try {
    const { bookIds, email, customerName, orderId }: DeliveryRequest = await request.json();

    if (!bookIds?.length || !email) {
      return NextResponse.json(
        { error: "Missing bookIds or email" },
        { status: 400 }
      );
    }

    // Fetch books with PDF URLs
    const { data: books, error } = await supabaseAdmin
      .from("books")
      .select("id, title, pdf_url")
      .in("id", bookIds);

    if (error) throw error;

    const booksWithPdf = (books || []).filter((book: { pdf_url?: string }) => book.pdf_url);

    if (booksWithPdf.length === 0) {
      return NextResponse.json(
        { error: "No PDFs available for the requested books" },
        { status: 404 }
      );
    }

    const deliveredBooks = booksWithPdf.map((book: { id: string; title: string; pdf_url: string }) => ({
      id: book.id,
      title: book.title,
      pdfUrl: book.pdf_url,
    }));

    // Send the delivery email instantly
    const result = await sendBookDeliveryEmail({
      to: email,
      customerName: customerName || "Reader",
      orderId,
      books: deliveredBooks,
    });

    if (!result.sent) {
      console.error("Failed to send ebook delivery email:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to send ebook delivery email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Ebook PDFs sent successfully to ${email}`,
      orderId,
      deliveredBooks,
    });
  } catch (error) {
    console.error("Error delivering books:", error);
    return NextResponse.json(
      { error: "Failed to deliver books" },
      { status: 500 }
    );
  }
}
