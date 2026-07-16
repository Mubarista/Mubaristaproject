import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("latte_art")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error fetching latte art:", error);
    return NextResponse.json({ error: "Failed to fetch latte art" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate that only likes can be updated via this endpoint
    if (body.likes === undefined) {
      return NextResponse.json({ error: "Only likes can be updated" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("latte_art")
      .update({ 
        likes: body.likes,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating latte art:", error);
    return NextResponse.json({ error: "Failed to update latte art" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("latte_art")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting latte art:", error);
    return NextResponse.json({ error: "Failed to delete latte art" }, { status: 500 });
  }
}
