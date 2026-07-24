"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabaseAdminAuth } from "@/lib/supabase";

interface Permission {
  id: string;
  roleId: string;
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface AdminAuthContextType {
  isAdminAuthed: boolean;
  isLoading: boolean;
  isExpired: boolean;
  isSuper: boolean;
  userId: string | null;
  permissions: Permission[];
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

async function fetchAdminSession(): Promise<{
  isAdmin: boolean;
  isExpired: boolean;
  isSuper: boolean;
  userId: string | null;
  permissions: Permission[];
} | null> {
  const { data, error } = await supabaseAdminAuth.auth.getSession();
  if (error || !data.session) return null;

  const res = await fetch("/api/admin/me", {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  });
  if (!res.ok) return null;
  const admin = await res.json();
  return {
    isAdmin: true,
    isExpired: admin.isExpired || false,
    isSuper: admin.isSuper || false,
    userId: admin.userId || null,
    permissions: admin.permissions || [],
  };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const clearAuth = useCallback(() => {
    setIsAdminAuthed(false);
    setIsExpired(false);
    setIsSuper(false);
    setUserId(null);
    setPermissions([]);
  }, []);

  const setAuth = useCallback((session: { isExpired: boolean; isSuper: boolean; userId: string | null; permissions: Permission[] }) => {
    setIsAdminAuthed(true);
    setIsExpired(session.isExpired);
    setIsSuper(session.isSuper);
    setUserId(session.userId);
    setPermissions(session.permissions);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkAdminStatus() {
      try {
        const session = await fetchAdminSession();
        if (!mounted) return;
        if (session) {
          setAuth(session);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Admin status check error:', error);
        if (mounted) clearAuth();
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    checkAdminStatus();

    const { data: { subscription } } = supabaseAdminAuth.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session) {
        clearAuth();
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const admin = await res.json();
          setAuth({
            isExpired: admin.isExpired || false,
            isSuper: admin.isSuper || false,
            userId: admin.userId || null,
            permissions: admin.permissions || [],
          });
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Admin auth state change error:', error);
        clearAuth();
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuth, setAuth]);

  const adminLogin = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseAdminAuth.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (!data.session) return { success: false, error: "Login failed." };

      const res = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!res.ok) {
        await supabaseAdminAuth.auth.signOut();
        return { success: false, error: "Access denied. Admin privileges required." };
      }

      const admin = await res.json();
      setAuth({
        isExpired: admin.isExpired || false,
        isSuper: admin.isSuper || false,
        userId: admin.userId || null,
        permissions: admin.permissions || [],
      });
      return { success: true };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: "An unexpected error occurred." };
    }
  }, [setAuth]);

  const adminLogout = useCallback(async () => {
    await supabaseAdminAuth.auth.signOut();
    clearAuth();
  }, [clearAuth]);

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthed, isLoading, isExpired, isSuper, userId, permissions, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
