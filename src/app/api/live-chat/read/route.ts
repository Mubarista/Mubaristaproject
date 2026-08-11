import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId, userId } = body;

    if (!messageId || !userId) {
      return NextResponse.json({ error: "Missing messageId or userId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("live_chat_messages")
      .select("read_by")
      .eq("id", messageId)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const readBy = new Set((data.read_by || []) as string[]);
    readBy.add(userId);

    const { error: updateError } = await supabaseAdmin
      .from("live_chat_messages")
      .update({ read_by: Array.from(readBy) })
      .eq("id", messageId);

    if (updateError) throw updateError;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking live chat message as read:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark as read" },
      { status: 500 }
    );
  }
}
