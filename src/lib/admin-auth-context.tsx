"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabaseAdminAuth } from "@/lib/supabase";

interface AdminAuthContextType {
  isAdminAuthed: boolean;
  isLoading: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  userId: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAdminStatus() {
      try {
        // Uses the dedicated admin client, isolated from the regular user session
        const { data: { session }, error } = await supabaseAdminAuth.auth.getSession();

        if (error) {
          console.error('Error getting admin session:', error);
          if (mounted) {
            setIsAdminAuthed(false);
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          setUserId(session.user.id);

          const { data: profile, error: profileError } = await supabaseAdminAuth
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }

          if (profile?.role === "admin" && mounted) {
            setIsAdminAuthed(true);
          } else if (mounted) {
            // Signed-in account on the admin client is not an admin — sign it
            // out of the admin client only (regular session is untouched).
            await supabaseAdminAuth.auth.signOut();
            setIsAdminAuthed(false);
          }
        } else if (mounted) {
          setIsAdminAuthed(false);
        }
      } catch (error) {
        console.error('Admin status check error:', error);
        if (mounted) {
          setIsAdminAuthed(false);
          setIsLoading(false);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    checkAdminStatus();

    // Listen to auth state changes on the admin client only
    const { data: { subscription } } = supabaseAdminAuth.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      try {
        if (session?.user) {
          setUserId(session.user.id);
          const { data: profile, error: profileError } = await supabaseAdminAuth
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile on auth change:', profileError);
          }

          setIsAdminAuthed(profile?.role === "admin");
        } else {
          setIsAdminAuthed(false);
          setUserId(null);
        }
      } catch (error) {
        console.error('Admin auth state change error:', error);
        setIsAdminAuthed(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const adminLogin = useCallback(async (email: string, password: string) => {
    try {
      // Authenticate on the dedicated admin client. This does NOT touch the
      // regular user session stored under a different storage key.
      const { data, error } = await supabaseAdminAuth.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };

      if (data.user) {
        const { data: profile, error: profileError } = await supabaseAdminAuth
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          if (profileError.code !== 'PGRST116') {
            console.error('Error fetching admin profile:', profileError);
          }
          await supabaseAdminAuth.auth.signOut();
          return { success: false, error: "Failed to verify admin privileges." };
        }

        if (profile?.role !== "admin") {
          await supabaseAdminAuth.auth.signOut();
          return { success: false, error: "Access denied. Admin privileges required." };
        }

        setUserId(data.user.id);
        setIsAdminAuthed(true);
        return { success: true };
      }
      return { success: false, error: "Login failed." };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: "An unexpected error occurred." };
    }
  }, []);

  const adminLogout = useCallback(async () => {
    // Sign out of the admin client only — the regular user session (stored
    // under a separate key) stays intact.
    await supabaseAdminAuth.auth.signOut();
    setIsAdminAuthed(false);
    setUserId(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthed, isLoading, adminLogin, adminLogout, userId }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
