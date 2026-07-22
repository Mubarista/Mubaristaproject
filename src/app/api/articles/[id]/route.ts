import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("articles")
      .select("*, article_categories ( id, name )")
      .eq("id", id)
      .single();

    if (error) throw error;

    const mapped = mapKeysToCamelCase(data);
    mapped.category = mapped.articleCategories?.name || data.category || "";
    mapped.categoryId = mapped.categoryId || null;
    delete mapped.articleCategories;

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}
