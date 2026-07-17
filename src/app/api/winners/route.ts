import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("winners").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching winners:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Creating winner:", body);
    
    // Clean the data by removing id and timestamp fields
    const { id, created_at, updated_at, ...cleanData } = body;
    
    // Remove empty fields (but keep image fields even if empty to allow updates)
    if (cleanData.winDate === "" || cleanData.winDate === undefined) {
      delete cleanData.winDate;
    }
    if (cleanData.prize === "" || cleanData.prize === undefined) {
      delete cleanData.prize;
    }
    if (cleanData.winType === "" || cleanData.winType === undefined) {
      delete cleanData.winType;
    }
    // Only remove artImage if it's explicitly undefined, not if it's empty string
    if (cleanData.artImage === undefined) {
      delete cleanData.artImage;
    }
    // Same for profile image
    if (cleanData.image === undefined) {
      delete cleanData.image;
    }
    
    const snakeCaseData = keysToSnakeCase(cleanData);
    console.log("Snake case data:", snakeCaseData);
    
    const { data, error } = await supabaseAdmin.from("winners").insert({
      ...snakeCaseData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();
    
    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
    
    console.log("Created winner:", data);
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating winner:", error);
    return NextResponse.json({ error: "Failed to create winner", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("Updating winner:", body);
    
    const { id, created_at, updated_at, ...updateData } = body;
    
    // Remove empty fields (but keep image fields even if empty to allow updates)
    if (updateData.winDate === "" || updateData.winDate === undefined) {
      delete updateData.winDate;
    }
    if (updateData.prize === "" || updateData.prize === undefined) {
      delete updateData.prize;
    }
    if (updateData.winType === "" || updateData.winType === undefined) {
      delete updateData.winType;
    }
    // Only remove artImage if it's explicitly undefined, not if it's empty string
    if (updateData.artImage === undefined) {
      delete updateData.artImage;
    }
    // Same for profile image
    if (updateData.image === undefined) {
      delete updateData.image;
    }
    
    const snakeCaseData = keysToSnakeCase(updateData);
    console.log("Snake case update data:", snakeCaseData);
    
    const { data, error } = await supabaseAdmin.from("winners").update({
      ...snakeCaseData,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) {
      console.error("Update error:", error);
      throw error;
    }
    
    console.log("Updated winner:", data);
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating winner:", error);
    return NextResponse.json({ error: "Failed to update winner", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing winner ID" }, { status: 400 });
    
    console.log("Deleting winner with ID:", id);
    
    const { error } = await supabaseAdmin.from("winners").delete().eq("id", id);
    
    if (error) {
      console.error("Delete error:", error);
      throw error;
    }
    
    console.log("Successfully deleted winner:", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting winner:", error);
    return NextResponse.json({ error: "Failed to delete winner", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
