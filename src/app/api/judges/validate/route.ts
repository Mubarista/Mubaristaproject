import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "missing_token" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("judge_credentials")
      .select("*")
      .eq("access_token", token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "invalid" }, { status: 404 });
    }

    const credential = mapKeysToCamelCase(data);

    // Check if the account is active
    if (!credential.active) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 });
    }

    // Check if the main account has expired
    if (credential.expiresAt) {
      const accountExpiry = new Date(credential.expiresAt);
      accountExpiry.setHours(23, 59, 59, 999);
      if (accountExpiry < new Date()) {
        return NextResponse.json({ error: "expired" }, { status: 403 });
      }
    }

    // Check if the access link has expired
    if (credential.accessLinkExpiresAt) {
      const linkExpiry = new Date(credential.accessLinkExpiresAt);
      linkExpiry.setHours(23, 59, 59, 999);
      if (linkExpiry < new Date()) {
        return NextResponse.json({ error: "link_expired" }, { status: 403 });
      }
    }

    return NextResponse.json(credential);
  } catch (error) {
    console.error("Error validating judge access token:", error);
    return NextResponse.json({ error: "invalid" }, { status: 500 });
  }
}
