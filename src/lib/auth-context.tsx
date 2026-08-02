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
    // Use the current session without an extra refresh to avoid blocking sign-in.
    // Supabase auto-refresh is enabled, so tokens stay fresh in the background.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No active session; signing out.");
      supabase.auth.signOut({ scope: "local" });
      return null;
    }
    const currentUser = session.user;

    // Try to fetch existing profile using maybeSingle to avoid empty-row errors
    const { data: profile, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching user profile:", fetchError.message || fetchError);
    }

    if (profile) return profile;

    // Create a profile for OAuth users or missing profiles
    const name = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "User";
    const phone = currentUser.user_metadata?.phone || "";
    const country = currentUser.user_metadata?.country || "";
    const email = currentUser.email || "";

    // For OAuth providers (Google, Apple, etc.), the email is already verified by the provider.
    // For email/password signups, email_verified must be false until the user completes OTP.
    const isOAuthUser = !!(currentUser.app_metadata?.provider && currentUser.app_metadata.provider !== "email");
    const emailVerified = isOAuthUser ? true : false;

    const profileData = {
      id: currentUser.id,
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
      if (error.code === "401" || error.message?.includes("JWT expired")) {
        await supabase.auth.signOut({ scope: "local" });
        return null;
      }
    }

    return newProfile;
  }

  useEffect(() => {
    let mounted = true;
    let heartbeat: NodeJS.Timeout | null = null;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        const profile = await ensureUserProfile(session.user);
        if (mounted) {
          if (profile) {
            setUser(mapSupabaseUser(session.user, profile));
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      } else if (mounted) {
        setIsLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        const profile = await ensureUserProfile(session.user);
        if (mounted) {
          if (profile) {
            setUser(mapSupabaseUser(session.user, profile));
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      }
    });

    // Keep the session alive while the tab is open so users can submit forms
    heartbeat = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (mounted) setUser(null);
      }
    }, 60000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === "Email not confirmed") {
        const result = await sendOTP(email);
        if (!result.success) throw new Error(result.message);
        throw new Error("OTP_SENT");
      }
      throw error;
    }
    if (data.user) {
      // Valid, confirmed email/password login. Sign the user in immediately.
      setUser(mapSupabaseUser(data.user, null));
    }
  }, [setUser]);

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
        "Sorry! Our system has detected that the email or phone number you're trying to use is associated with a recently deleted account. For security reasons, these details cannot be reused immediately. You can register again by using the same email or phone number in 30 days after the account was deleted."
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
      // Send custom email OTP for verification (uses project SMTP/Resend)
      const result = await sendOTP(email);
      if (!result.success) throw new Error(result.message || "Failed to send verification code");
    }
  }, [ensureUserProfile]);

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
      subscription_auto_renew: false,
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
      subscriptionAutoRenew: false,
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
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier }),
    });
    const data = await res.json().catch(() => ({ error: "Invalid response" }));
    return { success: res.ok, message: data.error || "OTP sent" };
  }, []);

  const verifyOTP = useCallback(async (identifier: string, code: string) => {
    if (identifier.startsWith("+")) {
      const result = await supabase.auth.verifyOtp({ phone: identifier, token: code, type: "sms" });
      if (!result.error && result.data?.user) {
        await supabase
          .from("users")
          .update({ email_verified: true, updated_at: new Date().toISOString() })
          .eq("id", result.data.user.id);

        const profile = await ensureUserProfile(result.data.user);
        setUser(mapSupabaseUser(result.data.user, profile));
      }
      return { success: !result.error, message: result.error?.message || "OTP verified" };
    }
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier, code }),
    });
    const data = await res.json().catch(() => ({ error: "Invalid response" }));
    return { success: res.ok, message: data.error || "OTP verified" };
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
    await sendOTP(user.email);
  }, [user, sendOTP]);

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