"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard, Star, Trophy, ClipboardList, LogOut,
  Menu, X, ShieldAlert, Lock,
} from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useJudgeAuth, type LoginError } from "@/lib/judge-auth-context";
import { safeSessionStorage } from "@/lib/safe-storage";
import { JudgeLogo } from "@/components/judge/judge-logo";

const TOKEN_KEY = "judge_access_token";

const nav = [
  { label: "Dashboard",  href: "/judge",            icon: LayoutDashboard },
  { label: "Score",      href: "/judge/score",       icon: Star },
  { label: "Leaderboard",href: "/judge/leaderboard", icon: Trophy },
  { label: "Reports",    href: "/judge/reports",     icon: ClipboardList },
];

const ERROR_MSG: Record<NonNullable<LoginError>, string> = {
  invalid_credentials: "Invalid username or password.",
  account_disabled:    "This judge account has been disabled by the admin.",
  expired:             "Your account access has expired. Contact the competition admin.",
  link_expired:        "This access link has expired. Please request a new link from the admin.",
  link_invalid:        "This access link is invalid or has been revoked.",
};

function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #c9a227 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }} />
    </div>
  );
}

function AccessDeniedScreen() {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0a0a12 0%, #0d1117 50%, #0a0f1a 100%)" }}>
      <Background />
      <div className="relative z-10 w-full px-6 py-4">
        <Link href="/judge" className="flex items-center gap-2.5">
          <JudgeLogo className="h-7 w-7" iconClassName="h-4 w-4" />
          <span className="text-base font-bold text-white tracking-tight">MUBARISTA</span>
        </Link>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl mb-6 shadow-2xl" style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}>
          <Lock className="h-10 w-10 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Access Restricted</h1>
        <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
          The judge portal is only available through a secure access link issued by the competition administration.
        </p>
        <div className="rounded-3xl border p-6" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(220,38,38,0.25)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-start gap-3 text-left">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
            <p className="text-sm text-white">
              Direct access to this page is not allowed. Please use the link sent by mubarista management or contact them to request a new one.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Link href="/" className="text-xs transition-colors" style={{ color: "#6b7280" }}>
            ← Back to MUBARISTA site
          </Link>
        </div>
      </div>
    </div>
  </div>
  );
}

function TokenErrorScreen({ error }: { error: LoginError }) {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0a0a12 0%, #0d1117 50%, #0a0f1a 100%)" }}>
      <Background />
      <div className="relative z-10 w-full px-6 py-4">
        <Link href="/judge" className="flex items-center gap-2.5">
          <JudgeLogo className="h-7 w-7" iconClassName="h-4 w-4" />
          <span className="text-base font-bold text-white tracking-tight">MUBARISTA</span>
        </Link>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl mb-6 shadow-2xl" style={{ background: "linear-gradient(135deg, #c9a227, #b45309)" }}>
            <ShieldAlert className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Access Link Failed</h1>
          <div className="rounded-3xl border p-6" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(201,162,39,0.25)", backdropFilter: "blur(20px)" }}>
            <p className="text-sm text-white">
              {error ? ERROR_MSG[error] : "Unable to verify access."}
            </p>
          </div>
          <div className="mt-6">
            <Link href="/" className="text-xs transition-colors" style={{ color: "#6b7280" }}>
              ← Back to MUBARISTA site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TokenLoadingScreen() {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0a0a12 0%, #0d1117 50%, #0a0f1a 100%)" }}>
      <Background />
      <div className="relative z-10 w-full px-6 py-4">
        <Link href="/judge" className="flex items-center gap-2.5">
          <JudgeLogo className="h-7 w-7" iconClassName="h-4 w-4" />
          <span className="text-base font-bold text-white tracking-tight">MUBARISTA</span>
        </Link>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <LoadingDots />
          <p className="text-sm text-white">Verifying secure access link…</p>
        </div>
      </div>
    </div>
  );
}

function TokenGateContent({ children }: { children: React.ReactNode }) {
  const { isJudgeAuthed, authenticateWithToken } = useJudgeAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [error, setError] = useState<LoginError>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Already logged in from a previous token in this session
    if (isJudgeAuthed) {
      setStatus("ready");
      return;
    }

    const tokenFromUrl = searchParams.get("token");
    const tokenFromStorage = safeSessionStorage.getItem(TOKEN_KEY);
    const token = tokenFromUrl ?? tokenFromStorage;

    if (!token) {
      setStatus("denied");
      return;
    }

    // Persist token for internal navigation
    if (tokenFromUrl) {
      safeSessionStorage.setItem(TOKEN_KEY, tokenFromUrl);
    }

    async function validateToken() {
      const err = await authenticateWithToken(token);
      if (err) {
        setError(err);
        setStatus("error");
        safeSessionStorage.removeItem(TOKEN_KEY);
      } else {
        setStatus("ready");
      }
    }

    validateToken();
  }, [isJudgeAuthed, authenticateWithToken, searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (status === "loading") return <TokenLoadingScreen />;
  if (status === "denied") return <AccessDeniedScreen />;
  if (status === "error") return <TokenErrorScreen error={error} />;
  return <>{children}</>;
}

function TokenGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<TokenLoadingScreen />}>
      <TokenGateContent>{children}</TokenGateContent>
    </Suspense>
  );
}

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { judgeLogout, judgeName } = useJudgeAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const initials = judgeName.split(" ").filter(w => w !== "Judge").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <TokenGate>
      <div className="min-h-screen flex flex-col" style={{ background: "#080b10" }}>
        {/* Minimal top bar — only the site name and a compact menu */}
        <header className="sticky top-0 z-30" style={{ background: "rgba(8,11,16,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(201,162,39,0.12)" }}>
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <Link href="/judge" className="flex items-center gap-2.5">
              <JudgeLogo className="h-7 w-7" iconClassName="h-4 w-4" />
              <span className="text-base font-bold text-white tracking-tight">MUBARISTA</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
                  style={{ background: "linear-gradient(135deg, #c9a227, #f5c842)" }}>
                  {initials}
                </div>
                <span className="text-xs font-medium text-white truncate max-w-[140px]">{judgeName || "Judge"}</span>
              </div>
              <button onClick={() => setMenuOpen(o => !o)}
                className="p-2 rounded-xl transition-colors"
                style={{ background: menuOpen ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.04)", color: menuOpen ? "#f5c842" : "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Slide-down menu */}
          {menuOpen && (
            <div className="px-4 sm:px-6 pb-4 space-y-1">
              {nav.map(item => {
                const active = item.href === "/judge" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={active
                      ? { background: "linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.1))", color: "#f5c842", border: "1px solid rgba(201,162,39,0.3)" }
                      : { color: "#9ca3af", border: "1px solid transparent" }
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
              <button onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ color: "#ef4444", border: "1px solid transparent" }}>
                <LogOut className="h-4 w-4 shrink-0" /> Sign Out
              </button>
            </div>
          )}
        </header>

        {/* Main */}
        <main className="flex-1">
          {children}
        </main>

        {/* Logout Confirmation Dialog */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-sm p-6 rounded-2xl" style={{ background: "rgba(8,11,16,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h2 className="text-lg font-bold text-white mb-2">Confirm Sign Out</h2>
              <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>Are you sure you want to sign out of the judge portal?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    judgeLogout();
                    setShowLogoutConfirm(false);
                    router.push("/");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white" }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TokenGate>
  );
}
