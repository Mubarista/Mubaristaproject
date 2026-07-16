import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // Join with tool_categories to get category name
    const { data, error } = await supabaseAdmin
      .from("tools")
      .select(`
        *,
        tool_categories (
          id,
          name
        )
      `)
      .order("order_column", { ascending: true });
    
    if (error) throw error;
    
    // Filter active tools unless includeInactive is true, then map order_column back to order
    const mappedData = (data || [])
      .filter((tool: any) => includeInactive || tool.active !== false)
      .map((tool: any) => {
        const mapped = mapKeysToCamelCase(tool);
        return {
          ...mapped,
          order: mapped.orderColumn || 0,
          orderColumn: undefined,
          category: mapped.toolCategories?.name || tool.category || '',
          categoryId: mapped.categoryId || null,
          toolCategories: undefined
        };
      });
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error fetching tools:", error);
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
        .from('tool_categories')
        .select('id')
        .eq('name', snakeCaseBody.category)
        .single();
      
      if (categoryData) {
        snakeCaseBody.category_id = categoryData.id;
      }
      delete snakeCaseBody.category;
    }
    
    const { data, error } = await supabaseAdmin.from("tools").insert({ 
      ...snakeCaseBody, 
      created_at: new Date().toISOString() 
    }).select(`
      *,
      tool_categories (
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
    mappedData.category = mappedData.toolCategories?.name || '';
    mappedData.categoryId = mappedData.categoryId || null;
    delete mappedData.toolCategories;
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error creating tool:", error);
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
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
        .from('tool_categories')
        .select('id')
        .eq('name', snakeCaseUpdate.category)
        .single();
      
      if (categoryData) {
        snakeCaseUpdate.category_id = categoryData.id;
      }
      delete snakeCaseUpdate.category;
    }
    
    const { data, error } = await supabaseAdmin.from("tools").update({ 
      ...snakeCaseUpdate, 
      updated_at: new Date().toISOString() 
    }).eq("id", id).select(`
      *,
      tool_categories (
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
    mappedData.category = mappedData.toolCategories?.name || '';
    mappedData.categoryId = mappedData.categoryId || null;
    delete mappedData.toolCategories;
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error updating tool:", error);
    return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing tool ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("tools").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tool:", error);
    return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
  }
}
