import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get("toolId");
    if (!toolId) {
      return NextResponse.json({ error: "Missing toolId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("tool_reviews")
      .select("*")
      .eq("tool_id", toolId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data || []));
  } catch (error) {
    console.error("Error fetching tool reviews:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toolId, userId, rating, comment } = body;

    if (!toolId || !userId || typeof rating !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("tool_reviews")
      .insert({
        tool_id: toolId,
        user_id: userId,
        rating,
        comment: comment || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate average rating and review count for this tool
    const { data: stats } = await supabaseAdmin
      .from("tool_reviews")
      .select("rating")
      .eq("tool_id", toolId);

    const reviews = stats || [];
    const count = reviews.length;
    const average = count > 0 ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0) / count : 0;

    await supabaseAdmin
      .from("tools")
      .update({ rating: average.toFixed(2), reviews: count, updated_at: new Date().toISOString() })
      .eq("id", toolId);

    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating tool review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("tool_reviews").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tool review:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
