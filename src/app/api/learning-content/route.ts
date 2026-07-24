import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { getAdminFromRequest, hasPermission, unauthorized, forbidden } from "@/lib/admin-api";

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
  const admin = await getAdminFromRequest(request);
  if (!admin) return unauthorized();
  if (!admin.isSuper && !hasPermission(admin, "learning", "create")) return forbidden();

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
    // For image content type, validate that at least one image with URL exists
    if (payload.content_type === "image") {
      const images = payload.images;
      if (!Array.isArray(images) || images.length === 0) {
        return NextResponse.json({ error: "Image content requires at least one image" }, { status: 400 });
      }
      const validImages = images.filter((img: { url?: string }) => img.url && img.url !== "");
      if (validImages.length === 0) {
        return NextResponse.json({ error: "Image content requires at least one image with a URL" }, { status: 400 });
      }
      if (images.length > 10) {
        return NextResponse.json({ error: "Maximum 10 images allowed" }, { status: 400 });
      }
    }

    // Remove any client-only fields
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.category;

    const isSuper = admin.isSuper;
    payload.status = isSuper ? "live" : "pending";
    payload.active = isSuper ? true : false;
    payload.submitted_by = isSuper ? null : admin.userId;
    payload.reviewed_by = isSuper ? admin.userId : null;
    payload.review_notes = null;

    const { data, error } = await supabaseAdmin.from("learning_content").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
    if (error) throw error;

    if (!isSuper) {
      await supabaseAdmin.from("content_reviews").insert({
        content_type: "learning_content",
        content_id: data.id,
        submitted_by: admin.userId,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    console.error("Error creating learning content:", error);
    return NextResponse.json({ error: error?.message || "Failed to create learning content" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return unauthorized();
  if (!admin.isSuper && !hasPermission(admin, "learning", "update")) return forbidden();

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

    const isSuper = admin.isSuper;
    const requestedStatus = payload.status;

    if (!isSuper) {
      // Sub-admins always re-submit for review when editing
      payload.status = "pending";
      payload.active = false;
      payload.submitted_by = admin.userId;
      payload.reviewed_by = null;
      payload.review_notes = null;
    } else if (requestedStatus === "live") {
      // Super admin publishing
      payload.active = true;
      payload.reviewed_by = admin.userId;
    }

    const { data, error } = await supabaseAdmin.from("learning_content").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;

    if (!isSuper) {
      await supabaseAdmin.from("content_reviews").insert({
        content_type: "learning_content",
        content_id: id,
        submitted_by: admin.userId,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    console.error("Error updating learning content:", error);
    return NextResponse.json({ error: error?.message || "Failed to update learning content" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return unauthorized();
  if (!admin.isSuper && !hasPermission(admin, "learning", "delete")) return forbidden();

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
