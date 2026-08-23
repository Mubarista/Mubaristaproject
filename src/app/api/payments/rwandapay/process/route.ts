import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getBaseUrl() {
  return process.env.RWANDAPAY_BASE_URL || "https://pay.rwandapay.rw/api/v1";
}

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const { session_id, phone, network, customer_name, email } = body;

    if (!session_id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!network || !["MTN", "Airtel"].includes(network)) {
      return NextResponse.json({ error: "Network must be MTN or Airtel" }, { status: 400 });
    }
    if (!customer_name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/checkout/${session_id}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        network,
        customer_name,
        email: email || "",
      }),
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: "Invalid response from RwandaPay",
    }));

    if (!response.ok) {
      console.error("RwandaPay process failed:", data);
      return NextResponse.json(
        { error: data.message || data.error || "Failed to process RwandaPay payment" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("RwandaPay process route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
