import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    const toolIds = items.map((i: any) => i.id);
    const { data: tools, error: fetchError } = await supabaseAdmin
      .from("tools")
      .select("id, stock")
      .in("id", toolIds);

    if (fetchError) throw fetchError;

    for (const item of items) {
      const tool = tools?.find((t: any) => t.id === item.id);
      if (!tool) {
        return NextResponse.json({ error: `Tool ${item.id} not found` }, { status: 400 });
      }
      if (tool.stock !== null && tool.stock !== undefined && tool.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for tool` },
          { status: 400 }
        );
      }
    }

    for (const item of items) {
      const tool = tools!.find((t: any) => t.id === item.id)!;
      if (tool.stock === null || tool.stock === undefined) continue;
      const { error: updateError } = await supabaseAdmin
        .from("tools")
        .update({ stock: tool.stock - item.quantity })
        .eq("id", item.id);
      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error decrementing stock:", error);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
