"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User, UserRole } from "@/types";
import { supabase } from "@/lib/supabase";
import { addSubscriptionDuration } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, country: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: (planId: string, duration: "weekly" | "monthly" | "yearly") => Promise<void>;
  cancelSubscription: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isPremium: boolean;
  sendOTP: (identifier: string, method?: "email" | "phone") => Promise<{ success: boolean; message: string }>;
  verifyOTP: (identifier: string, code: string) => Promise<{ success: boolean; message: string }>;
  reloadUser: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  deleteAccount: (firstName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(authUser: any, profile?: any): User {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: profile?.name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
    role: (profile?.role as UserRole) || "user",
    isPremium:
      (profile?.is_premium || false) &&
      (!profile?.subscription_expiry || new Date(profile.subscription_expiry) > new Date()),
    phone: profile?.phone || authUser.user_metadata?.phone || "",
    country: profile?.country || authUser.user_metadata?.country || "",
    avatar: profile?.avatar || authUser.user_metadata?.avatar || "",
    // Use the database email_verified column as source of truth, not Supabase's email_confirmed_at
    // (which is auto-set when enable_confirmations=false)
    emailVerified: profile?.email_verified ?? false,
    createdAt: authUser.created_at || new Date().toISOString(),
    updatedAt: profile?.updated_at || new Date().toISOString(),
    subscriptionPlan: profile?.subscription_plan || null,
    subscriptionExpiry: profile?.subscription_expiry || null,
    subscriptionDuration: profile?.subscription_duration || null,
    subscriptionAutoRenew: profile?.subscription_auto_renew ?? true,
    subscriptionNextRenewal: profile?.subscription_next_renewal || null,
    subscriptionCanceledAt: profile?.subscription_canceled_at || null,
    subscriptionRenewalFailures: profile?.subscription_renewal_failures || 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

    // For OAuth providers (Google, Apple, etc.), the email is already verified by the provider.
    // For email/password signups, email_verified must be false until the user completes OTP.
    const isOAuthUser = !!(authUser.app_metadata?.provider && authUser.app_metadata.provider !== "email");
    const emailVerified = isOAuthUser ? true : false;

    const profileData = {
      id: authUser.id,
      email,
      name,
      phone,
      country,
      role: "user",
      is_premium: false,
      email_verified: emailVerified,
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
    if (error) {
      if (error.message === "Email not confirmed") {
        await supabase.auth.signInWithOtp({ email });
        throw new Error("OTP_SENT");
      }
      throw error;
    }
    if (data.user) {
      // Email/password logins always require OTP verification.
      // Sign out the password session and send a one-time code to the email.
      await supabase.auth.signOut();
      await supabase.auth.signInWithOtp({ email });
      throw new Error("OTP_SENT");
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl.replace(/\/$/, "")}/dashboard` },
    });
    if (error) throw error;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, phone: string, country: string) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: blocked } = await supabase
      .from("deleted_accounts")
      .select("deleted_at")
      .or(`email.eq.${email},phone.eq.${phone}`)
      .gte("deleted_at", since)
      .maybeSingle();

    if (blocked) {
      throw new Error(
        "This email or phone number was used by a deleted account. Please wait 30 days after deletion to register again."
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, country } },
    });
    if (error) throw error;
    if (data.user) {
      // If autoconfirm is enabled, sign out so the user must verify with OTP first
      if (data.session) await supabase.auth.signOut();
      await ensureUserProfile(data.user);
      // Send email OTP for verification
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) throw otpError;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut({ scope: "global" });
    setUser(null);
    await router.push("/");
  }, [router]);

  const upgradeToPremium = useCallback(async (planId: string, duration: "weekly" | "monthly" | "yearly") => {
    if (!user) return;
    const now = new Date();
    const expiry = addSubscriptionDuration(now, duration);
    const updates = {
      is_premium: true,
      subscription_plan: planId,
      subscription_duration: duration,
      subscription_expiry: expiry.toISOString(),
      subscription_next_renewal: expiry.toISOString(),
      subscription_auto_renew: true,
      subscription_canceled_at: null,
      subscription_renewal_failures: 0,
      updated_at: now.toISOString(),
    };
    await supabase.from("users").update(updates).eq("id", user.id);
    const updatedUser: User = {
      ...user,
      isPremium: true,
      subscriptionPlan: planId,
      subscriptionDuration: duration,
      subscriptionExpiry: expiry.toISOString(),
      subscriptionNextRenewal: expiry.toISOString(),
      subscriptionAutoRenew: true,
      subscriptionCanceledAt: null,
      subscriptionRenewalFailures: 0,
      updatedAt: now.toISOString(),
    };
    setUser(updatedUser);
  }, [user]);

  const cancelSubscription = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const updates = {
      subscription_auto_renew: false,
      subscription_canceled_at: now,
      updated_at: now,
    };
    await supabase.from("users").update(updates).eq("id", user.id);
    const updatedUser: User = {
      ...user,
      subscriptionAutoRenew: false,
      subscriptionCanceledAt: now,
      updatedAt: now,
    };
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
    const result = identifier.startsWith("+")
      ? await supabase.auth.verifyOtp({ phone: identifier, token: code, type: "sms" })
      : await supabase.auth.verifyOtp({ email: identifier, token: code, type: "email" });
    if (!result.error && result.data?.user) {
      // OTP verified successfully — mark the user's email as verified in the database
      await supabase
        .from("users")
        .update({ email_verified: true, updated_at: new Date().toISOString() })
        .eq("id", result.data.user.id);

      const profile = await ensureUserProfile(result.data.user);
      setUser(mapSupabaseUser(result.data.user, profile));
    }
    return { success: !result.error, message: result.error?.message || "OTP verified" };
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

  const deleteAccount = useCallback(async (firstName: string) => {
    if (!user) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Session expired. Please log in again.");

    const res = await fetch("/api/delete-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ firstName: firstName.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to delete account" }));
      throw new Error(data.error || "Failed to delete account");
    }

    await logout();
  }, [user, logout]);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    upgradeToPremium,
    cancelSubscription,
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