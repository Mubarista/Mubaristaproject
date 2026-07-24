import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAdminFromRequest, unauthorized } from "@/lib/admin-api";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return unauthorized();

  try {
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("roles")
      .select("*, permissions:permissions(*)")
      .order("name", { ascending: true });

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
    }

    return NextResponse.json(mapKeysToCamelCase(roles || []));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch roles" }, { status: 500 });
  }
}
