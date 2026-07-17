import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { validatePhoneNumber } from "@/lib/phone-utils";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If an id is provided, treat this as a profile update.
    if (body.id) {
      const { id, ...updateData } = body;

      if (updateData.phone) {
        const phoneValidation = validatePhoneNumber(updateData.phone);
        if (!phoneValidation.valid) {
          return NextResponse.json({ error: phoneValidation.error || "Invalid phone number" }, { status: 400 });
        }
      }

      const { data, error } = await supabaseAdmin
        .from("users")
        .update({ ...keysToSnakeCase(updateData), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(mapKeysToCamelCase(data));
    }

    // Otherwise, create a new user.
    if (body.phone) {
      const phoneValidation = validatePhoneNumber(body.phone);
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: phoneValidation.error || "Invalid phone number" }, { status: 400 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({ ...keysToSnakeCase(body), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (updateData.phone) {
      const phoneValidation = validatePhoneNumber(updateData.phone);
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: phoneValidation.error || "Invalid phone number" }, { status: 400 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ ...keysToSnakeCase(updateData), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
