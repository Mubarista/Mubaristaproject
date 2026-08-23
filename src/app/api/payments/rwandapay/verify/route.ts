import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getBaseUrl() {
  return process.env.RWANDAPAY_BASE_URL || "https://pay.rwandapay.rw/api/v1";
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const reference = req.nextUrl.searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/checkout/${reference}/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({
      status: "failed",
      success: false,
      message: "Invalid response from RwandaPay",
    }));

    if (!response.ok) {
      console.error("RwandaPay verify failed:", data);
      return NextResponse.json(
        { error: data.message || data.error || "Failed to verify RwandaPay payment" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("RwandaPay verify route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
