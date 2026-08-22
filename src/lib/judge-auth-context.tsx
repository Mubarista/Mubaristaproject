"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useAdminData } from "@/lib/admin-data-context";

export type LoginError = "invalid_credentials" | "account_disabled" | "expired" | "link_expired" | "link_invalid" | null;

interface TokenValidationResult {
  credential: JudgeSession | null;
  error: LoginError;
}

interface JudgeAuthContextType {
  isJudgeAuthed: boolean;
  termsAccepted: boolean;
  judgeLogin: (username: string, password: string) => LoginError;
  judgeLoginWithToken: (token: string) => LoginError;
  validateToken: (token: string | null) => Promise<TokenValidationResult>;
  authenticateWithToken: (token: string, password: string) => Promise<LoginError>;
  acceptTerms: () => Promise<boolean>;
  judgeLogout: () => void;
  judgeName: string;
  judgeId: string;
  assignedCompetition: string;
}

interface JudgeSession {
  id: string;
  name: string;
  assignedCompetition: string;
  active: boolean;
  expiresAt?: string;
  accessLinkExpiresAt?: string;
  accessToken?: string;
  username?: string;
  password?: string;
  termsAcceptedAt?: string | null;
}

const JudgeAuthContext = createContext<JudgeAuthContextType | undefined>(undefined);

export function JudgeAuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [judgeName, setJudgeName] = useState("");
  const [judgeId, setJudgeId] = useState("");
  const [assignedCompetition, setAssignedCompetition] = useState("");
  const { judgeCredentials } = useAdminData();

  function isAccountExpired(c: { expiresAt?: string | null }): boolean {
    if (!c.expiresAt) return false;
    const expiry = new Date(c.expiresAt);
    expiry.setHours(23, 59, 59, 999);
    return expiry < new Date();
  }

  function isLinkExpired(c: { accessLinkExpiresAt?: string | null }): boolean {
    if (!c.accessLinkExpiresAt) return false;
    const expiry = new Date(c.accessLinkExpiresAt);
    expiry.setHours(23, 59, 59, 999);
    return expiry < new Date();
  }

  function setSession(c: { id: string; name: string; assignedCompetition: string; termsAcceptedAt?: string | null }) {
    setAuthed(true);
    setJudgeName(c.name);
    setJudgeId(c.id);
    setAssignedCompetition(c.assignedCompetition);
    setTermsAccepted(!!c.termsAcceptedAt);
  }

  function clearSession() {
    setAuthed(false);
    setJudgeName("");
    setJudgeId("");
    setAssignedCompetition("");
    setTermsAccepted(false);
  }

  const acceptTerms = useCallback(async (): Promise<boolean> => {
    if (!judgeId) return false;
    try {
      const response = await fetch("/api/judges/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgeId }),
      });
      if (response.ok) {
        setTermsAccepted(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error accepting terms:", error);
      return false;
    }
  }, [judgeId]);

  const judgeLogin = useCallback((username: string, password: string): LoginError => {
    const match = judgeCredentials.find(
      c => c.username === username && c.password === password
    );
    if (!match) return "invalid_credentials";
    if (!match.active) return "account_disabled";
    if (isAccountExpired(match)) return "expired";
    setSession({
      id: match.id,
      name: match.name,
      assignedCompetition: match.assignedCompetition,
      termsAcceptedAt: match.termsAcceptedAt,
    });
    return null;
  }, [judgeCredentials]);

  // Synchronous fallback for callers that need sync behavior
  const judgeLoginWithToken = useCallback((token: string): LoginError => {
    const match = judgeCredentials.find(c => c.accessToken === token);
    if (!match) return "link_invalid";
    if (isLinkExpired(match)) return "link_expired";
    if (!match.active) return "account_disabled";
    if (isAccountExpired(match)) return "expired";
    setSession({
      id: match.id,
      name: match.name,
      assignedCompetition: match.assignedCompetition,
      termsAcceptedAt: match.termsAcceptedAt,
    });
    return null;
  }, [judgeCredentials]);

  // Async API-based token validation - only checks the token, does not log in
  const validateToken = useCallback(async (token: string | null): Promise<TokenValidationResult> => {
    if (!token) return { credential: null, error: "link_invalid" };
    try {
      const response = await fetch(`/api/judges/validate?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "invalid" }));
        const error = data.error as LoginError;
        if (error === "account_disabled" || error === "expired" || error === "link_expired") {
          return { credential: null, error };
        }
        return { credential: null, error: "link_invalid" };
      }

      const credential = (await response.json()) as JudgeSession;

      if (!credential.active) return { credential: null, error: "account_disabled" };
      if (isAccountExpired(credential)) return { credential: null, error: "expired" };
      if (isLinkExpired(credential)) return { credential: null, error: "link_expired" };

      return { credential, error: null };
    } catch (error) {
      console.error("Judge token validation error:", error);
      return { credential: null, error: "link_invalid" };
    }
  }, []);

  // Async API-based validation with password - checks the token and password, then logs in
  const authenticateWithToken = useCallback(async (token: string, password: string): Promise<LoginError> => {
    try {
      const response = await fetch("/api/judges/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "invalid" }));
        const error = data.error as LoginError;
        if (error === "account_disabled" || error === "expired" || error === "link_expired" || error === "invalid_credentials") {
          return error;
        }
        return "link_invalid";
      }

      const credential = (await response.json()) as JudgeSession;
      setSession({
        id: credential.id,
        name: credential.name,
        assignedCompetition: credential.assignedCompetition,
        termsAcceptedAt: credential.termsAcceptedAt,
      });
      return null;
    } catch (error) {
      console.error("Judge authentication error:", error);
      return "link_invalid";
    }
  }, []);

  function judgeLogout() {
    clearSession();
  }

  return (
    <JudgeAuthContext.Provider value={{ isJudgeAuthed: authed, termsAccepted, judgeLogin, judgeLogout, judgeLoginWithToken, validateToken, authenticateWithToken, acceptTerms, judgeName, judgeId, assignedCompetition }}>
      {children}
    </JudgeAuthContext.Provider>
  );
}

export function useJudgeAuth() {
  const ctx = useContext(JudgeAuthContext);
  if (!ctx) throw new Error("useJudgeAuth must be used within JudgeAuthProvider");
  return ctx;
}
