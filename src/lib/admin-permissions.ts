"use client";

import { useAdminAuth } from "./admin-auth-context";

type Action = "create" | "read" | "update" | "delete";

export function useCan(module: string, action: Action) {
  const { isSuper, permissions, allowedModules } = useAdminAuth();
  if (isSuper) return true;
  const key = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as
    | "canCreate"
    | "canRead"
    | "canUpdate"
    | "canDelete";
  const roleHas = permissions.some((p) => p.module === module && p[key]);
  if (roleHas) return true;
  // Allowed modules grant read/create/update access to content creators
  if (action !== "delete" && allowedModules?.includes(module)) return true;
  return false;
}
