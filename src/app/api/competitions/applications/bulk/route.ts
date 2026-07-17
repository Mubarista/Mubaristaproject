import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type BulkAction = "delete" | "archive" | "revoke" | "activate";

const VALID_ACTIONS: BulkAction[] = ["delete", "archive", "revoke", "activate"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids, action, all = false } = body as { ids?: string[]; action?: BulkAction | string; all?: boolean };

    if (!action || !VALID_ACTIONS.includes(action as BulkAction)) {
      return NextResponse.json({ error: "Invalid or missing action" }, { status: 400 });
    }

    if (!all && (!Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ error: "No application IDs provided" }, { status: 400 });
    }

    if (action === "delete") {
      let query = supabaseAdmin.from("competition_applications").delete();
      if (!all) {
        query = query.in("id", ids!);
      }
      const { error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, deleted: true });
    }

    const statusByAction: Record<BulkAction, string> = {
      archive: "archived",
      revoke: "revoked",
      activate: "active",
      delete: "",
    };

    const newStatus = statusByAction[action as BulkAction];
    let query = supabaseAdmin.from("competition_applications").update({ status: newStatus });
    if (!all) {
      query = query.in("id", ids!);
    }
    const { data, error } = await query.select();
    if (error) throw error;

    return NextResponse.json({ success: true, action, updated: data?.length ?? 0 });
  } catch (error) {
    console.error("Error in bulk application action:", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
