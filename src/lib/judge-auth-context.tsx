"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useAdminData } from "@/lib/admin-data-context";

export type LoginError = "invalid_credentials" | "account_disabled" | "expired" | "link_expired" | "link_invalid" | null;

interface JudgeAuthContextType {
  isJudgeAuthed: boolean;
  judgeLogin: (username: string, password: string) => LoginError;
  judgeLoginWithToken: (token: string) => LoginError;
  authenticateWithToken: (token: string | null) => Promise<LoginError>;
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
}

const JudgeAuthContext = createContext<JudgeAuthContextType | undefined>(undefined);

export function JudgeAuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
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

  function setSession(c: { id: string; name: string; assignedCompetition: string }) {
    setAuthed(true);
    setJudgeName(c.name);
    setJudgeId(c.id);
    setAssignedCompetition(c.assignedCompetition);
  }

  function clearSession() {
    setAuthed(false);
    setJudgeName("");
    setJudgeId("");
    setAssignedCompetition("");
  }

  const judgeLogin = useCallback((username: string, password: string): LoginError => {
    const match = judgeCredentials.find(
      c => c.username === username && c.password === password
    );
    if (!match) return "invalid_credentials";
    if (!match.active) return "account_disabled";
    if (isAccountExpired(match)) return "expired";
    setSession(match);
    return null;
  }, [judgeCredentials]);

  // Synchronous fallback for callers that need sync behavior
  const judgeLoginWithToken = useCallback((token: string): LoginError => {
    const match = judgeCredentials.find(c => c.accessToken === token);
    if (!match) return "link_invalid";
    if (isLinkExpired(match)) return "link_expired";
    if (!match.active) return "account_disabled";
    if (isAccountExpired(match)) return "expired";
    setSession(match);
    return null;
  }, [judgeCredentials]);

  // Async API-based validation - checks the real database
  const authenticateWithToken = useCallback(async (token: string | null): Promise<LoginError> => {
    if (!token) return "link_invalid";
    try {
      const response = await fetch(`/api/judges/validate?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "invalid" }));
        const error = data.error as LoginError;
        if (error === "account_disabled" || error === "expired" || error === "link_expired") {
          return error;
        }
        return "link_invalid";
      }

      const credential = (await response.json()) as JudgeSession;

      // Double-check expiry on the client side as well
      if (!credential.active) return "account_disabled";
      if (isAccountExpired(credential)) return "expired";
      if (isLinkExpired(credential)) return "link_expired";

      setSession(credential);
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
    <JudgeAuthContext.Provider value={{ isJudgeAuthed: authed, judgeLogin, judgeLogout, judgeLoginWithToken, authenticateWithToken, judgeName, judgeId, assignedCompetition }}>
      {children}
    </JudgeAuthContext.Provider>
  );
}

export function useJudgeAuth() {
  const ctx = useContext(JudgeAuthContext);
  if (!ctx) throw new Error("useJudgeAuth must be used within JudgeAuthProvider");
  return ctx;
}
