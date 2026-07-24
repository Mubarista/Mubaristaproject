import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-api";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(admin);
}
