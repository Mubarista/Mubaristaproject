// Server-side helpers for admin API routes
import { supabaseAdmin } from "./supabase-admin";
import { mapKeysToCamelCase } from "./supabase-utils";

export interface AdminSession {
  userId: string;
  email?: string;
  name?: string;
  roleName?: string;
  isSuper: boolean;
  isExpired: boolean;
  allowedModules?: string[];
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
    allowedModules?: string[];
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
    const allowedModules: string[] = Array.isArray(tm.allowed_modules)
      ? tm.allowed_modules
      : [];

    return {
      userId,
      email,
      name: tm.name || email?.split("@")[0] || "",
      roleName: tm.roles?.name || "Team Member",
      isSuper: tm.role_id === "super_admin",
      isExpired: !tm.is_active || isExpired,
      allowedModules,
      team: mapKeysToCamelCase({ ...tm, allowed_modules: allowedModules }),
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
    return { userId, email, name: email?.split("@")[0] || "Admin", roleName: "Super Admin", isSuper: true, isExpired: false };
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
  const roleHas = admin.permissions?.some((p) => p.module === module && p[key]) ?? false;
  if (roleHas) return true;
  // Content creators can be granted extra modules; they never get delete through allowedModules
  if (action !== "delete" && admin.allowedModules?.includes(module)) return true;
  return false;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
