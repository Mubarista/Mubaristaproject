import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

const PUBLIC_FIELDS = "id, name, username, assigned_competition, active, expires_at, access_token, access_link_expires_at, created_at, updated_at";

async function getCredentialByToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from("judge_credentials")
    .select(PUBLIC_FIELDS)
    .eq("access_token", token)
    .single();

  if (error || !data) return { credential: null, error: "invalid" as const };

  const credential = mapKeysToCamelCase(data);

  if (!credential.active) return { credential: null, error: "account_disabled" as const };

  if (credential.expiresAt) {
    const accountExpiry = new Date(credential.expiresAt);
    accountExpiry.setHours(23, 59, 59, 999);
    if (accountExpiry < new Date()) return { credential: null, error: "expired" as const };
  }

  if (credential.accessLinkExpiresAt) {
    const linkExpiry = new Date(credential.accessLinkExpiresAt);
    linkExpiry.setHours(23, 59, 59, 999);
    if (linkExpiry < new Date()) return { credential: null, error: "link_expired" as const };
  }

  return { credential, error: null };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "missing_token" }, { status: 400 });
    }

    const { credential, error } = await getCredentialByToken(token);
    if (error || !credential) {
      return NextResponse.json({ error }, { status: error === "invalid" ? 404 : 403 });
    }

    return NextResponse.json(credential);
  } catch (error) {
    console.error("Error validating judge access token:", error);
    return NextResponse.json({ error: "invalid" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "missing_token_or_password" }, { status: 400 });
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

    if (!credential.active) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 });
    }

    if (credential.expiresAt) {
      const accountExpiry = new Date(credential.expiresAt);
      accountExpiry.setHours(23, 59, 59, 999);
      if (accountExpiry < new Date()) {
        return NextResponse.json({ error: "expired" }, { status: 403 });
      }
    }

    if (credential.accessLinkExpiresAt) {
      const linkExpiry = new Date(credential.accessLinkExpiresAt);
      linkExpiry.setHours(23, 59, 59, 999);
      if (linkExpiry < new Date()) {
        return NextResponse.json({ error: "link_expired" }, { status: 403 });
      }
    }

    if (credential.password !== password) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const publicCredential = mapKeysToCamelCase(
      await supabaseAdmin
        .from("judge_credentials")
        .select(PUBLIC_FIELDS)
        .eq("id", credential.id)
        .single()
        .then((r) => r.data)
    );

    return NextResponse.json(publicCredential);
  } catch (error) {
    console.error("Error verifying judge password:", error);
    return NextResponse.json({ error: "invalid" }, { status: 500 });
  }
}
