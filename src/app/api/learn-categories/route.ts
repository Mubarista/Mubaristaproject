import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const { data, error } = await supabaseAdmin.from("learn_categories").select("*").order("order", { ascending: true });
    if (error) throw error;
    
    // Filter active categories unless includeInactive is true
    const filteredData = (mapKeysToCamelCase(data) || [])
      .filter((category: any) => includeInactive || category.active !== false);
    
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Error fetching learn categories:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("learn_categories").insert({ ...keysToSnakeCase(body), created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating learn category:", error);
    return NextResponse.json({ error: "Failed to create learn category" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const { data, error } = await supabaseAdmin.from("learn_categories").update({ ...keysToSnakeCase(updateData), updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating learn category:", error);
    return NextResponse.json({ error: "Failed to update learn category" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing learn category ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("learn_categories").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting learn category:", error);
    return NextResponse.json({ error: "Failed to delete learn category" }, { status: 500 });
  }
}
