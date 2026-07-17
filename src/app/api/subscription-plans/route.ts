import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, mapKeysToSnakeCase } from "@/lib/supabase-utils";

function mapPlan(row: any) {
  const mapped = mapKeysToCamelCase(row);
  return {
    ...mapped,
    price: Number(mapped.price) || 0,
    active: mapped.isActive ?? mapped.active ?? true,
    isActive: undefined,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    let query = supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json((data || []).map(mapPlan));
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { active, isActive, ...rest } = body;

    const dbRecord: Record<string, any> = {
      ...mapKeysToSnakeCase(rest),
      is_active: isActive ?? active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .upsert(dbRecord)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapPlan(data));
  } catch (error) {
    console.error("Error upserting subscription plan:", error);
    return NextResponse.json({ error: "Failed to save subscription plan" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing plan ID" }, { status: 400 });

    const { error } = await supabaseAdmin.from("subscription_plans").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return NextResponse.json({ error: "Failed to delete subscription plan" }, { status: 500 });
  }
}
