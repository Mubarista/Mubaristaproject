import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    let query = supabaseAdmin.from("learning_content").select("*").order("order", { ascending: true });
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching learning content:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = keysToSnakeCase(body);

    // Basic validation to turn DB errors into actionable 400s
    if (!payload.title || typeof payload.title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!payload.category_id || payload.category_id === "") {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!["text", "video", "image"].includes(payload.content_type)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }
    if (payload.content_type === "video" && (!payload.media_url || payload.media_url === "")) {
      return NextResponse.json({ error: "Video content requires a media URL" }, { status: 400 });
    }
    if (payload.content_type === "image" && (!payload.media_url || payload.media_url === "")) {
      return NextResponse.json({ error: "Image content requires a media URL" }, { status: 400 });
    }

    // Remove any client-only fields
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.category;

    const { data, error } = await supabaseAdmin.from("learning_content").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    console.error("Error creating learning content:", error);
    return NextResponse.json({ error: error?.message || "Failed to create learning content" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing content ID" }, { status: 400 });
    }
    const payload = keysToSnakeCase(updateData);
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.category;

    const { data, error } = await supabaseAdmin.from("learning_content").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    console.error("Error updating learning content:", error);
    return NextResponse.json({ error: error?.message || "Failed to update learning content" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing content ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("learning_content").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting learning content:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete learning content" }, { status: 500 });
  }
}
