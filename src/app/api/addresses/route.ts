import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

const TIMESTAMP = new Date().toISOString();

async function unsetOtherDefaults(userId: string, type: string, excludeId?: string) {
  let query = supabaseAdmin
    .from("addresses")
    .update({ is_default: false, updated_at: TIMESTAMP })
    .eq("user_id", userId)
    .eq("type", type);
  if (excludeId) query = query.neq("id", excludeId);
  await query;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, addressLine1, label, fullName, phone, city, country } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!type || !["delivery", "pickup"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Use 'delivery' or 'pickup'" }, { status: 400 });
    }
    if (!addressLine1 || !label || !fullName || !phone || !city || !country) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isDefault = body.isDefault || false;
    if (isDefault) {
      await unsetOtherDefaults(userId, type);
    }

    const insertData = {
      user_id: userId,
      type,
      label,
      full_name: fullName,
      phone,
      address_line1: addressLine1,
      address_line2: body.addressLine2 || null,
      city,
      country,
      zip_code: body.zipCode || null,
      is_default: isDefault,
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
    };

    const { data, error } = await supabaseAdmin.from("addresses").insert(insertData).select().single();
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    console.error("Error creating address:", error);
    return NextResponse.json({ error: error.message || "Failed to create address" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing address id" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin.from("addresses").select("*").eq("id", id).single();
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const snakeData = keysToSnakeCase(updateData);
    const isDefault = snakeData.is_default;
    const type = snakeData.type || existing.type;
    const userId = snakeData.user_id || existing.user_id;

    if (isDefault) {
      await unsetOtherDefaults(userId, type, id);
    }

    const { data, error } = await supabaseAdmin
      .from("addresses")
      .update({ ...snakeData, updated_at: TIMESTAMP })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    console.error("Error updating address:", error);
    return NextResponse.json({ error: error.message || "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing address id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("addresses").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
