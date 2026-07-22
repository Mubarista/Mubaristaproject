import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    // Join with article_categories to get category name
    const { data, error } = await supabaseAdmin
      .from("articles")
      .select(`
        *,
        article_categories (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    const mappedData = (data || []).map((article: any) => {
      const mapped = mapKeysToCamelCase(article);
      return {
        ...mapped,
        category: mapped.articleCategories?.name || article.category || '',
        categoryId: mapped.categoryId || null,
        articleCategories: undefined
      };
    });
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, ...createData } = body;
    const snakeCaseBody = keysToSnakeCase(createData);
    
    // Handle category_id - if categoryId is provided, use it; otherwise try to find category by name
    if ('categoryId' in snakeCaseBody && snakeCaseBody.categoryId) {
      // Keep categoryId as is
    } else if ('category' in snakeCaseBody && snakeCaseBody.category) {
      // Try to find category by name and set categoryId
      const { data: categoryData } = await supabaseAdmin
        .from('article_categories')
        .select('id')
        .eq('name', snakeCaseBody.category)
        .single();
      
      if (categoryData) {
        snakeCaseBody.category_id = categoryData.id;
      }
      delete snakeCaseBody.category;
    }
    
    const { data, error } = await supabaseAdmin
      .from("articles")
      .insert({ ...snakeCaseBody, created_at: new Date().toISOString() })
      .select(`
        *,
        article_categories (
          id,
          name
        )
      `)
      .single();
    
    if (error) throw error;
    
    const mappedData = mapKeysToCamelCase(data);
    mappedData.category = mappedData.articleCategories?.name || '';
    mappedData.categoryId = mappedData.categoryId || null;
    delete mappedData.articleCategories;
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const snakeCaseUpdate = keysToSnakeCase(updateData);
    
    // Handle category_id - if categoryId is provided, use it; otherwise try to find category by name
    if ('categoryId' in snakeCaseUpdate && snakeCaseUpdate.categoryId) {
      // Keep categoryId as is
    } else if ('category' in snakeCaseUpdate && snakeCaseUpdate.category) {
      // Try to find category by name and set categoryId
      const { data: categoryData } = await supabaseAdmin
        .from('article_categories')
        .select('id')
        .eq('name', snakeCaseUpdate.category)
        .single();
      
      if (categoryData) {
        snakeCaseUpdate.category_id = categoryData.id;
      }
      delete snakeCaseUpdate.category;
    }
    
    const { data, error } = await supabaseAdmin
      .from("articles")
      .update({ ...snakeCaseUpdate, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(`
        *,
        article_categories (
          id,
          name
        )
      `)
      .single();
    
    if (error) throw error;
    
    const mappedData = mapKeysToCamelCase(data);
    mappedData.category = mappedData.articleCategories?.name || '';
    mappedData.categoryId = mappedData.categoryId || null;
    delete mappedData.articleCategories;
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
