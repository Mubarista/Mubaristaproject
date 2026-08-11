import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId");

    if (!competitionId) {
      return NextResponse.json({ error: "Missing competitionId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("live_chat_messages")
      .select("*")
      .eq("competition_id", competitionId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching live chat messages:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { competitionId, userId, participantName, message } = body;

    if (!competitionId || !message?.trim()) {
      return NextResponse.json({ error: "Competition and message are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("live_chat_messages")
      .insert({
        ...keysToSnakeCase({
          competitionId,
          userId,
          participantName,
          message: message.trim(),
        }),
        read_by: [userId].filter(Boolean),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating live chat message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
