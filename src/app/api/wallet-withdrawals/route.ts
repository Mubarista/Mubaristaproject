import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("wallet_withdrawals").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching wallet withdrawals:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("wallet_withdrawals").insert({
      ...keysToSnakeCase(body),
      status: "pending",
      created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating wallet withdrawal:", error);
    return NextResponse.json({ error: "Failed to create wallet withdrawal" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const { data, error } = await supabaseAdmin.from("wallet_withdrawals").update({
      ...keysToSnakeCase(updateData),
      updated_at: new Date().toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating wallet withdrawal:", error);
    return NextResponse.json({ error: "Failed to update wallet withdrawal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing withdrawal ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("wallet_withdrawals").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wallet withdrawal:", error);
    return NextResponse.json({ error: "Failed to delete wallet withdrawal" }, { status: 500 });
  }
}