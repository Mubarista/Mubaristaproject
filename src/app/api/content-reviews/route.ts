import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAdminFromRequest, hasPermission, unauthorized, forbidden } from "@/lib/admin-api";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return unauthorized();
  if (!admin.isSuper && !hasPermission(admin, "learning", "read")) return forbidden();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("content_reviews")
    .select("*, learning_content(*), submittedBy:submitted_by(*), reviewedBy:reviewed_by(*)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapKeysToCamelCase(data || []));
}

export async function PUT(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return unauthorized();
  if (!admin.isSuper && !hasPermission(admin, "learning", "update")) return forbidden();

  try {
    const body = await request.json();
    const { id, status: reviewStatus, reviewNotes } = body;

    if (!id || !reviewStatus) {
      return NextResponse.json({ error: "Review ID and status are required" }, { status: 400 });
    }

    if (!["approved", "rejected"].includes(reviewStatus)) {
      return NextResponse.json({ error: "Invalid review status" }, { status: 400 });
    }

    // Fetch the review to find content id and type
    const { data: review, error: reviewError } = await supabaseAdmin
      .from("content_reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const update = {
      status: reviewStatus,
      review_notes: reviewNotes || null,
      reviewed_by: admin.userId,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from("content_reviews")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update the associated learning content
    if (review.content_type === "learning_content") {
      await supabaseAdmin
        .from("learning_content")
        .update({
          status: reviewStatus === "approved" ? "live" : "rejected",
          active: reviewStatus === "approved",
          reviewed_by: admin.userId,
          review_notes: reviewNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", review.content_id);
    }

    return NextResponse.json(mapKeysToCamelCase(updatedReview));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update review" }, { status: 500 });
  }
}
