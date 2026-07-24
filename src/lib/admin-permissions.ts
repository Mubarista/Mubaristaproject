"use client";

import { useAdminAuth } from "./admin-auth-context";

type Action = "create" | "read" | "update" | "delete";

export function useCan(module: string, action: Action) {
  const { isSuper, permissions } = useAdminAuth();
  if (isSuper) return true;
  const key = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as
    | "canCreate"
    | "canRead"
    | "canUpdate"
    | "canDelete";
  return permissions.some((p) => p.module === module && p[key]);
}
