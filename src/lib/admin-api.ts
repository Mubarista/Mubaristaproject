// Server-side helpers for admin API routes
import { supabaseAdmin } from "./supabase-admin";
import { mapKeysToCamelCase } from "./supabase-utils";

export interface AdminSession {
  userId: string;
  email?: string;
  isSuper: boolean;
  isExpired: boolean;
  team?: {
    id: string;
    email: string;
    name?: string;
    roleId: string;
    isActive: boolean;
    expiresAt?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  permissions?: {
    id: string;
    roleId: string;
    module: string;
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }[];
}

export async function getAdminFromRequest(request: Request): Promise<AdminSession | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const userId = data.user.id;
  const email = data.user.email;

  // Check team member record (active and not expired)
  const { data: tm, error: tmError } = await supabaseAdmin
    .from("team_members")
    .select("*, roles(*)")
    .eq("id", userId)
    .maybeSingle();

  if (tm && !tmError) {
    const isExpired = new Date(tm.expires_at) < new Date();
    const { data: perms } = await supabaseAdmin
      .from("permissions")
      .select("*")
      .eq("role_id", tm.role_id);

    return {
      userId,
      email,
      isSuper: tm.role_id === "super_admin",
      isExpired: !tm.is_active || isExpired,
      team: mapKeysToCamelCase(tm),
      permissions: perms ? perms.map(mapKeysToCamelCase) : [],
    };
  }

  // Fallback: legacy super admin from users table
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") {
    return { userId, email, isSuper: true, isExpired: false };
  }

  return null;
}

export function hasPermission(
  admin: AdminSession | null,
  module: string,
  action: "create" | "read" | "update" | "delete"
): boolean {
  if (!admin) return false;
  if (admin.isSuper) return true;
  const key = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as
    | "canCreate"
    | "canRead"
    | "canUpdate"
    | "canDelete";
  return admin.permissions?.some((p) => p.module === module && p[key]) ?? false;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
