import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAdminFromRequest, hasPermission, unauthorized, forbidden } from "@/lib/admin-api";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return unauthorized();
  if (!admin.isSuper && !hasPermission(admin, "team", "read")) return forbidden();

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  let query = supabaseAdmin
    .from("team_members")
    .select("*, roles(*)")
    .order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapKeysToCamelCase(data || []));
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin || !admin.isSuper) return unauthorized();

  try {
    const body = await request.json();
    const { email, password, name, roleId, expiresAt } = body;

    if (!email || !password || !roleId || !expiresAt) {
      return NextResponse.json(
        { error: "Email, password, role, and expiration date are required" },
        { status: 400 }
      );
    }

    // Create Supabase auth user with confirmed email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Ensure public users profile exists
    await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: userId,
          email,
          name: name || email.split("@")[0],
          email_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    // Insert team member record
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from("team_members")
      .insert({
        id: userId,
        email,
        name: name || email.split("@")[0],
        role_id: roleId,
        is_active: true,
        expires_at: new Date(expiresAt).toISOString(),
        created_by: admin.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 500 });
    }

    return NextResponse.json(mapKeysToCamelCase(teamData));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create team member" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin || !admin.isSuper) return unauthorized();

  try {
    const body = await request.json();
    const { id, name, roleId, expiresAt, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing team member ID" }, { status: 400 });
    }

    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) update.name = name;
    if (roleId !== undefined) update.role_id = roleId;
    if (expiresAt !== undefined) update.expires_at = new Date(expiresAt).toISOString();
    if (isActive !== undefined) update.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from("team_members")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync name to users profile
    if (name !== undefined) {
      await supabaseAdmin.from("users").update({ name }).eq("id", id);
    }

    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update team member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin || !admin.isSuper) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing team member ID" }, { status: 400 });
  }

  // Delete team member record first (foreign key constraint to users)
  const { error: deleteTeamError } = await supabaseAdmin.from("team_members").delete().eq("id", id);
  if (deleteTeamError) {
    return NextResponse.json({ error: deleteTeamError.message }, { status: 500 });
  }

  // Delete public profile and auth user
  await supabaseAdmin.from("users").delete().eq("id", id);
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authDeleteError) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
