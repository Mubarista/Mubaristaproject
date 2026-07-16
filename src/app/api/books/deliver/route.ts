import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    // In a real app, you would integrate with an email service like Resend, SendGrid, AWS SES, etc.
    // For this implementation, we'll return the delivery payload so the frontend can show a confirmation
    // and the admin/system can send the email using the configured email provider.
    const deliveredBooks = booksWithPdf.map((book: { id: string; title: string; pdf_url: string }) => ({
      id: book.id,
      title: book.title,
      pdfUrl: book.pdf_url,
    }));

    // Log delivery attempt
    console.log(`Book delivery prepared for ${email}`, {
      orderId,
      customerName,
      books: deliveredBooks,
    });

    return NextResponse.json({
      success: true,
      message: `Book PDFs ready for delivery to ${email}`,
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
