import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("judge_credentials").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    
    // Handle backward compatibility - add email field if missing
    const normalizedData = (mapKeysToCamelCase(data) || []).map((item: any) => ({
      ...item,
      email: item.email || "",
    }));
    
    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error("Error fetching judge credentials:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const snakeCaseData = keysToSnakeCase(body);
    
    // Remove email if column doesn't exist yet
    const { data, error } = await supabaseAdmin.from("judge_credentials").insert({
      ...snakeCaseData,
      email: snakeCaseData.email || "",
      created_at: new Date().toISOString(),
    }).select().single();
    
    if (error) {
      // If error is about column not existing, try without email
      if (error.message?.includes('column') && error.message?.includes('email')) {
        const { email, ...dataWithoutEmail } = snakeCaseData;
        const { data: retryData, error: retryError } = await supabaseAdmin.from("judge_credentials").insert({
          ...dataWithoutEmail,
          created_at: new Date().toISOString(),
        }).select().single();
        if (retryError) throw retryError;
        return NextResponse.json(mapKeysToCamelCase({ ...retryData, email: body.email || "" }));
      }
      throw error;
    }
    
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating judge credential:", error);
    return NextResponse.json({ error: "Failed to create judge credential" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const snakeCaseData = keysToSnakeCase(updateData);
    
    const { data, error } = await supabaseAdmin
      .from("judge_credentials")
      .update({
        ...snakeCaseData,
        email: snakeCaseData.email || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      // If error is about column not existing, try without email
      if (error.message?.includes('column') && error.message?.includes('email')) {
        const { email, ...dataWithoutEmail } = snakeCaseData;
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from("judge_credentials")
          .update({
            ...dataWithoutEmail,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();
        if (retryError) throw retryError;
        return NextResponse.json(mapKeysToCamelCase({ ...retryData, email: body.email || "" }));
      }
      throw error;
    }
    
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating judge credential:", error);
    return NextResponse.json({ error: "Failed to update judge credential" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("judge_credentials").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting judge credential:", error);
    return NextResponse.json({ error: "Failed to delete judge credential" }, { status: 500 });
  }
}
