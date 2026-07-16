import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // Join with book_categories to get category name
    const { data, error } = await supabaseAdmin
      .from("books")
      .select(`
        *,
        book_categories (
          id,
          name
        )
      `)
      .order("order_column", { ascending: true });
    
    if (error) throw error;
    
    // Filter active books unless includeInactive is true, then map order_column back to order
    const mappedData = (data || [])
      .filter((book: { active?: boolean }) => includeInactive || book.active !== false)
      .map((book: Record<string, unknown>) => {
        const mapped = mapKeysToCamelCase(book);
        return {
          ...mapped,
          order: mapped.orderColumn || 0,
          orderColumn: undefined,
          pdfUrl: mapped.pdfUrl || '',
          category: mapped.bookCategories?.name || book.category || '',
          categoryId: mapped.categoryId || null,
          bookCategories: undefined
        };
      });
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const snakeCaseBody = keysToSnakeCase(body);
    
    // Handle order to order_column mapping
    if ('order' in snakeCaseBody) {
      snakeCaseBody.order_column = snakeCaseBody.order;
      delete snakeCaseBody.order;
    }
    
    // Handle category_id - if categoryId is provided, use it; otherwise try to find category by name
    if ('categoryId' in snakeCaseBody && snakeCaseBody.categoryId) {
      // Keep categoryId as is
    } else if ('category' in snakeCaseBody && snakeCaseBody.category) {
      // Try to find category by name and set categoryId
      const { data: categoryData } = await supabaseAdmin
        .from('book_categories')
        .select('id')
        .eq('name', snakeCaseBody.category)
        .single();
      
      if (categoryData) {
        snakeCaseBody.category_id = categoryData.id;
      }
      delete snakeCaseBody.category;
    }
    
    const { data, error } = await supabaseAdmin.from("books").insert({ 
      ...snakeCaseBody, 
      created_at: new Date().toISOString() 
    }).select(`
      *,
      book_categories (
        id,
        name
      )
    `).single();
    
    if (error) throw error;
    
    // Map order_column back to order for response
    const mappedData = mapKeysToCamelCase(data);
    if (mappedData.orderColumn !== undefined) {
      mappedData.order = mappedData.orderColumn;
      delete mappedData.orderColumn;
    }
    mappedData.pdfUrl = mappedData.pdfUrl || '';
    mappedData.category = mappedData.bookCategories?.name || '';
    mappedData.categoryId = mappedData.categoryId || null;
    delete mappedData.bookCategories;
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const snakeCaseUpdate = keysToSnakeCase(updateData);
    
    // Handle order to order_column mapping
    if ('order' in snakeCaseUpdate) {
      snakeCaseUpdate.order_column = snakeCaseUpdate.order;
      delete snakeCaseUpdate.order;
    }
    
    // Handle category_id - if categoryId is provided, use it; otherwise try to find category by name
    if ('categoryId' in snakeCaseUpdate && snakeCaseUpdate.categoryId) {
      // Keep categoryId as is
    } else if ('category' in snakeCaseUpdate && snakeCaseUpdate.category) {
      // Try to find category by name and set categoryId
      const { data: categoryData } = await supabaseAdmin
        .from('book_categories')
        .select('id')
        .eq('name', snakeCaseUpdate.category)
        .single();
      
      if (categoryData) {
        snakeCaseUpdate.category_id = categoryData.id;
      }
      delete snakeCaseUpdate.category;
    }
    
    const { data, error } = await supabaseAdmin.from("books").update({ 
      ...snakeCaseUpdate, 
      updated_at: new Date().toISOString() 
    }).eq("id", id).select(`
      *,
      book_categories (
        id,
        name
      )
    `).single();
    
    if (error) throw error;
    
    // Map order_column back to order for response
    const mappedData = mapKeysToCamelCase(data);
    if (mappedData.orderColumn !== undefined) {
      mappedData.order = mappedData.orderColumn;
      delete mappedData.orderColumn;
    }
    mappedData.pdfUrl = mappedData.pdfUrl || '';
    mappedData.category = mappedData.bookCategories?.name || '';
    mappedData.categoryId = mappedData.categoryId || null;
    delete mappedData.bookCategories;
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing book ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("books").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
