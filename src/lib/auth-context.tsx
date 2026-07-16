"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, country: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: (planId: string, duration: "weekly" | "monthly" | "yearly") => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isPremium: boolean;
  sendOTP: (identifier: string, method?: "email" | "phone") => Promise<{ success: boolean; message: string }>;
  verifyOTP: (identifier: string, code: string) => Promise<{ success: boolean; message: string }>;
  reloadUser: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(authUser: any, profile?: any): User {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: profile?.name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
    role: (profile?.role as UserRole) || "user",
    isPremium: profile?.is_premium || false,
    phone: profile?.phone || authUser.user_metadata?.phone || "",
    country: profile?.country || authUser.user_metadata?.country || "",
    avatar: profile?.avatar || authUser.user_metadata?.avatar || "",
    emailVerified: authUser.email_confirmed_at ? true : false,
    createdAt: authUser.created_at || new Date().toISOString(),
    updatedAt: profile?.updated_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function ensureUserProfile(authUser: any) {
    // Try to fetch existing profile using maybeSingle to avoid empty-row errors
    const { data: profile, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching user profile:", fetchError.message || fetchError);
    }

    if (profile) return profile;

    // Create a profile for OAuth users or missing profiles
    const name = authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User";
    const phone = authUser.user_metadata?.phone || "";
    const country = authUser.user_metadata?.country || "";
    const email = authUser.email || "";

    const profileData = {
      id: authUser.id,
      email,
      name,
      phone,
      country,
      role: "user",
      is_premium: false,
      email_verified: authUser.email_confirmed_at ? true : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Use upsert to avoid conflicts if the profile was created by the DB trigger
    // or another request in the meantime
    const { data: newProfile, error } = await supabase
      .from("users")
      .upsert(profileData, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Error creating user profile:", error.message || error.code || JSON.stringify(error));
    }

    return newProfile;
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        const profile = await ensureUserProfile(session.user);
        setUser(mapSupabaseUser(session.user, profile));
      }
      if (mounted) setIsLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await ensureUserProfile(session.user);
        setUser(mapSupabaseUser(session.user, profile));
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await ensureUserProfile(data.user);
      setUser(mapSupabaseUser(data.user, profile));
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, phone: string, country: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, country } },
    });
    if (error) throw error;
    if (data.user) {
      const profile = await ensureUserProfile(data.user);
      setUser(mapSupabaseUser(data.user, profile));
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const upgradeToPremium = useCallback(async (_planId: string, _duration: "weekly" | "monthly" | "yearly") => {
    if (!user) return;
    await supabase.from("users").update({ is_premium: true, updated_at: new Date().toISOString() }).eq("id", user.id);
    const updatedUser: User = { ...user, isPremium: true, updatedAt: new Date().toISOString() };
    setUser(updatedUser);
  }, [user]);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  }, [user]);

  const sendOTP = useCallback(async (identifier: string, method?: "email" | "phone") => {
    if (method === "phone" || identifier.startsWith("+")) {
      const { error } = await supabase.auth.signInWithOtp({ phone: identifier });
      return { success: !error, message: error?.message || "OTP sent" };
    }
    const { error } = await supabase.auth.signInWithOtp({ email: identifier });
    return { success: !error, message: error?.message || "OTP sent" };
  }, []);

  const verifyOTP = useCallback(async (identifier: string, code: string) => {
    if (identifier.startsWith("+")) {
      const { error } = await supabase.auth.verifyOtp({ phone: identifier, token: code, type: "sms" });
      return { success: !error, message: error?.message || "OTP verified" };
    }
    const { error } = await supabase.auth.verifyOtp({ email: identifier, token: code, type: "email" });
    return { success: !error, message: error?.message || "OTP verified" };
  }, []);

  const reloadUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await ensureUserProfile(session.user);
      setUser(mapSupabaseUser(session.user, profile));
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!user?.email) return;
    await supabase.auth.resend({ type: "signup", email: user.email });
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    await supabase.from("users").delete().eq("id", user.id);
    await supabase.auth.signOut();
    setUser(null);
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    upgradeToPremium,
    hasRole,
    isPremium: user?.isPremium || false,
    sendOTP,
    verifyOTP,
    reloadUser,
    resendVerificationEmail,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
