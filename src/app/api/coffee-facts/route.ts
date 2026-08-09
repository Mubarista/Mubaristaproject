import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("coffee_facts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching coffee facts:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    let fields = rest;
    let { data, error } = { data: null as any, error: null as any };

    for (let i = 0; i < 5; i++) {
      const insertData: any = { ...keysToSnakeCase(fields), created_at: new Date().toISOString() };
      ({ data, error } = await supabaseAdmin.from("coffee_facts").insert(insertData).select().single());

      if (!error) break;

      if (error && (error as any).code === "PGRST204") {
        const match = (error as any).message?.match(/Could not find the '([^']+)' column of 'coffee_facts' in the schema cache/);
        const missingColumn = match ? match[1] : null;
        if (missingColumn && (fields as any)[missingColumn] !== undefined) {
          const { [missingColumn]: _, ...restWithout } = fields;
          fields = restWithout;
          continue;
        }
      }

      break;
    }

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating coffee fact:", error);
    return NextResponse.json({ error: "Failed to create coffee fact" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    let fields = updateData;
    let { data, error } = { data: null as any, error: null as any };

    for (let i = 0; i < 5; i++) {
      const updatePayload: any = { ...keysToSnakeCase(fields), updated_at: new Date().toISOString() };
      ({ data, error } = await supabaseAdmin.from("coffee_facts").update(updatePayload).eq("id", id).select().single());

      if (!error) break;

      if (error && (error as any).code === "PGRST204") {
        const match = (error as any).message?.match(/Could not find the '([^']+)' column of 'coffee_facts' in the schema cache/);
        const missingColumn = match ? match[1] : null;
        if (missingColumn && (fields as any)[missingColumn] !== undefined) {
          const { [missingColumn]: _, ...restWithout } = fields;
          fields = restWithout;
          continue;
        }
      }

      break;
    }

    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating coffee fact:", error);
    return NextResponse.json({ error: "Failed to update coffee fact" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing coffee fact ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("coffee_facts").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coffee fact:", error);
    return NextResponse.json({ error: "Failed to delete coffee fact" }, { status: 500 });
  }
}
