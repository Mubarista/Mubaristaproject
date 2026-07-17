import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const { data, error } = await supabaseAdmin.from("timeline").select("*").order("order_column", { ascending: true });
    if (error) throw error;
    
    // Filter active timeline events unless includeInactive is true, then map order_column back to order
    const mappedData = (mapKeysToCamelCase(data) || [])
      .filter((event: any) => includeInactive || event.active !== false)
      .map((event: any) => ({
        ...event,
        order: event.orderColumn || 0,
        orderColumn: undefined
      }));
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error fetching timeline:", error);
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
    
    const { data, error } = await supabaseAdmin.from("timeline").insert({ 
      ...snakeCaseBody, 
      created_at: new Date().toISOString() 
    }).select().single();
    if (error) throw error;
    
    // Map order_column back to order for response
    const mappedData = mapKeysToCamelCase(data);
    if (mappedData.orderColumn !== undefined) {
      mappedData.order = mappedData.orderColumn;
      delete mappedData.orderColumn;
    }
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error creating timeline event:", error);
    return NextResponse.json({ error: "Failed to create timeline event" }, { status: 500 });
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
    
    const { data, error } = await supabaseAdmin.from("timeline").update({ 
      ...snakeCaseUpdate, 
      updated_at: new Date().toISOString() 
    }).eq("id", id).select().single();
    if (error) throw error;
    
    // Map order_column back to order for response
    const mappedData = mapKeysToCamelCase(data);
    if (mappedData.orderColumn !== undefined) {
      mappedData.order = mappedData.orderColumn;
      delete mappedData.orderColumn;
    }
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error updating timeline event:", error);
    return NextResponse.json({ error: "Failed to update timeline event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing timeline event ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("timeline").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting timeline event:", error);
    return NextResponse.json({ error: "Failed to delete timeline event" }, { status: 500 });
  }
}
