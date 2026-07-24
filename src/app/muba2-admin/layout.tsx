"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Medal,
  Image,
  Star,
  Building2,
  Coffee,
  Lightbulb,
  FileText,
  HelpCircle,
  BookOpen,
  Wrench,
  Briefcase,
  GraduationCap,
  Clock,
  UserCheck,
  BarChart3,
  Home,
  ChevronRight,
  Sparkles,
  Globe,
  DollarSign,
  Scale,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Users,
  RefreshCw,
  Settings,
  Tags,
  Search,
  X,
  Crown,
  ListOrdered,
  Sun,
  Moon,
} from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { useTheme, ThemeProvider } from "@/lib/theme-context";

const sections = [
  { label: "Overview", href: "/mbhubteam", icon: LayoutDashboard, module: "dashboard" },
  { label: "Hero & Stats", href: "/mbhubteam/hero", icon: Home, module: "hero" },
  { label: "How It Works", href: "/mbhubteam/how-it-works", icon: ListOrdered, module: "how_it_works" },
  { label: "Competitions", href: "/mbhubteam/competitions", icon: Trophy, module: "competitions" },
  { label: "Applicants", href: "/mbhubteam/applications", icon: UserCheck, module: "applications" },
  { label: "Winners", href: "/mbhubteam/winners", icon: Medal, module: "winners" },
  { label: "Latte Art", href: "/mbhubteam/latte-art", icon: Image, module: "latte_art" },
  { label: "Testimonials", href: "/mbhubteam/testimonials", icon: Star, module: "testimonials" },
  { label: "Sponsors", href: "/mbhubteam/sponsors", icon: Building2, module: "sponsors" },
  { label: "Coffee Facts", href: "/mbhubteam/coffee-facts", icon: Coffee, module: "coffee_facts" },
  { label: "Tips & Skills", href: "/mbhubteam/tips", icon: Lightbulb, module: "tips" },
  { label: "Articles", href: "/mbhubteam/articles", icon: FileText, module: "articles" },
  { label: "FAQs", href: "/mbhubteam/faqs", icon: HelpCircle, module: "faq" },
  { label: "Learn Categories", href: "/mbhubteam/learn", icon: BookOpen, module: "learning" },
  { label: "Categories", href: "/mbhubteam/categories", icon: Tags, module: "categories" },
  { label: "Books", href: "/mbhubteam/books", icon: BookOpen, module: "books" },
  { label: "Tools", href: "/mbhubteam/tools", icon: Wrench, module: "tools" },
  { label: "Jobs", href: "/mbhubteam/jobs", icon: Briefcase, module: "jobs" },
  { label: "Schools", href: "/mbhubteam/schools", icon: GraduationCap, module: "schools" },
  { label: "Coffee Timeline", href: "/mbhubteam/timeline", icon: Clock, module: "timeline" },
  { label: "Legends", href: "/mbhubteam/legends", icon: UserCheck, module: "legends" },
  { label: "About", href: "/mbhubteam/about", icon: FileText, module: "about" },
  { label: "Contact", href: "/mbhubteam/contact", icon: Building2, module: "contact" },
  { label: "Message Center", href: "/mbhubteam/messages", icon: HelpCircle, module: "messages" },
  { label: "Countries", href: "/mbhubteam/countries", icon: Globe, module: "categories" },
  { label: "Payments", href: "/mbhubteam/payments", icon: DollarSign, module: "payments" },
  { label: "Subscription Plans", href: "/mbhubteam/subscription-plans", icon: Crown, module: "settings" },
  { label: "Judges",   href: "/mbhubteam/judges",   icon: Scale, module: "judges" },
  { label: "Team", href: "/mbhubteam/team", icon: Users, module: "team" },
  { label: "Reviews", href: "/mbhubteam/reviews", icon: FileText, module: "learning" },
  { label: "Settings", href: "/mbhubteam/settings", icon: Settings, module: "settings" },
];

function AdminLoginScreen() {
  const { adminLogin } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : ({} as any)))
      .then((data: any) => {
        if (!cancelled) {
          setLogoUrl(data?.logo || null);
          setLogoLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLogoLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await adminLogin(email, password);
      if (!result.success) {
        setError(result.error || "Invalid email or password.");
      } else if (!result.isSuper) {
        const permitted = sections.find(
          (s) =>
            result.permissions?.some((p) => p.module === s.module && p.canRead) ||
            result.allowedModules?.includes(s.module)
        );
        if (permitted && permitted.href !== "/mbhubteam") {
          router.push(permitted.href);
        }
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-blue/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-red/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden bg-muted-bg mb-4">
            {logoLoading ? (
              <div className="h-8 w-8 rounded-full border-2 border-muted border-t-transparent animate-spin" />
            ) : logoUrl ? (
              <img src={logoUrl} alt="MUBARISTA" className="h-full w-full object-contain" />
            ) : null}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            MUBA<span className="text-blue">RISTA</span>
          </h1>
          <p className="text-muted text-sm mt-1">MubaristaHub Overview</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue/10">
              <Lock className="h-4 w-4 text-blue" />
            </div>
            <div>
              <h2 className="font-semibold text-base">MubaristaHub Login</h2>
              <p className="text-xs text-muted">Restricted access — authorised personnel only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted mb-1.5 block">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue transition-all"
                placeholder="admin@mubarista.com"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red/10 border border-red/20 text-red text-sm">
                <Lock className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue text-white font-semibold text-sm hover:bg-blue-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Sign In to Admin Portal"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <Link href="/" className="text-xs text-muted hover:text-foreground transition-colors">
              ← Back to MUBARISTAHUB Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpiredAccountScreen({ onLogout }: { onLogout: () => void | Promise<void> }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="relative w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-yellow/10 flex items-center justify-center text-yellow">
              <RefreshCw className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Account Access Restricted</h2>
          <p className="text-muted text-sm mb-6">
            Your team account is expired, suspended, or banned. Contact the Super Admin for access renewal.
          </p>
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-xl bg-blue text-white font-semibold text-sm hover:bg-blue-dark transition-colors"
          >
            Request Renewal & Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdminAuthed, isLoading, isExpired, isSuper, adminLogout, userId, permissions, allowedModules } = useAdminAuth();
  const visibleSections = isSuper
    ? sections
    : sections.filter((s) =>
        permissions.some((p) => p.module === s.module && p.canRead) || allowedModules.includes(s.module)
      );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [pendingApplicantsCount, setPendingApplicantsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Wait for auth state to settle and avoid fetching while the dev server may still be starting
    if (isLoading) return;

    if (!isAdminAuthed) {
      setDataReady(true);
      return;
    }

    let cancelled = false;

    async function loadAdminData() {
      setDataReady(false);
      await Promise.all([
        fetchSettings(),
        fetchPendingApplicantsCount(),
        fetchUnreadMessagesCount(),
        userId ? fetchUser() : Promise.resolve(),
      ]);
      if (!cancelled) setDataReady(true);
    }

    loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isAdminAuthed, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === 'Escape' && showGlobalSearch) {
        setShowGlobalSearch(false);
        setGlobalSearchQuery("");
        setSearchResults([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGlobalSearch]);

  // Refresh pending applicant count periodically and when the tab becomes active again
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingApplicantsCount();
    }, 30000);
    const handleVisibility = () => {
      if (!document.hidden) fetchPendingApplicantsCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Refresh unread message count periodically, on visibility, and when messages are marked as read
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) fetchUnreadMessagesCount();
    };
    const interval = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("unread-count-changed", refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("unread-count-changed", refresh);
    };
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetchWithRetry("/api/site-settings");
      if (res?.ok) {
        const data = await res.json();
        setSettings(data || {});
      }
    } catch (error) {
      console.warn("Error fetching site settings:", error);
      setSettings({});
    }
  }

  async function fetchUser() {
    if (!userId) return;
    try {
      const res = await fetchWithRetry(`/api/user?userId=${userId}`);
      if (res?.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.warn("Error fetching user:", error);
    }
  }

  async function fetchPendingApplicantsCount() {
    try {
      const res = await fetchWithRetry("/api/competitions/apply");
      if (res?.ok) {
        const data = await res.json();
        const count = (data || []).filter(
          (app: any) =>
            (app.status === "pending" || app.status === "nominated") &&
            app.paymentStatus !== "paid"
        ).length;
        setPendingApplicantsCount(count);
      }
    } catch (error) {
      console.warn("Error fetching pending applicants count:", error);
    }
  }

  async function fetchUnreadMessagesCount() {
    try {
      const res = await fetchWithRetry("/api/messages?status=unread");
      if (res?.ok) {
        const data = await res.json();
        setUnreadMessagesCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.warn("Error fetching unread messages count:", error);
    }
  }

  async function fetchWithRetry(url: string, retries = 1, delay = 1000) {
    try {
      return await fetch(url);
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay);
    }
  }

  async function performGlobalSearch(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results: any[] = [];
      const q = query.toLowerCase();
      
      // Search sections (navigation items)
      sections.forEach((section) => {
        if (section.label.toLowerCase().includes(q)) {
          results.push({ type: "Section", name: section.label, subtitle: "Navigation", href: section.href, icon: section.icon });
        }
      });
      
      // Search tools
      try {
        const toolsRes = await fetch("/api/tools");
        if (toolsRes.ok) {
          const tools = await toolsRes.json();
          tools.forEach((t: any) => {
            if (t.name.toLowerCase().includes(q) || t.brand.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) {
              results.push({ type: "Tool", name: t.name, subtitle: t.brand, href: `/mbhubteam/tools`, icon: Wrench });
            }
          });
        }
      } catch {}
      
      // Search books
      try {
        const booksRes = await fetch("/api/books");
        if (booksRes.ok) {
          const books = await booksRes.json();
          books.forEach((b: any) => {
            if (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)) {
              results.push({ type: "Book", name: b.title, subtitle: b.author, href: `/mbhubteam/books`, icon: BookOpen });
            }
          });
        }
      } catch {}
      
      // Search articles
      try {
        const articlesRes = await fetch("/api/articles");
        if (articlesRes.ok) {
          const articles = await articlesRes.json();
          articles.forEach((a: any) => {
            if (a.title.toLowerCase().includes(q) || a.author.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)) {
              results.push({ type: "Article", name: a.title, subtitle: a.author, href: `/mbhubteam/articles`, icon: FileText });
            }
          });
        }
      } catch {}
      
      // Search legends
      try {
        const legendsRes = await fetch("/api/legends");
        if (legendsRes.ok) {
          const legends = await legendsRes.json();
          legends.forEach((l: any) => {
            if (l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)) {
              results.push({ type: "Legend", name: l.name, subtitle: l.country, href: `/mbhubteam/legends`, icon: UserCheck });
            }
          });
        }
      } catch {}
      
      // Search winners
      try {
        const winnersRes = await fetch("/api/winners");
        if (winnersRes.ok) {
          const winners = await winnersRes.json();
          winners.forEach((w: any) => {
            if (w.name.toLowerCase().includes(q) || w.competition.toLowerCase().includes(q)) {
              results.push({ type: "Winner", name: w.name, subtitle: w.competition, href: `/mbhubteam/winners`, icon: Medal });
            }
          });
        }
      } catch {}
      
      setSearchResults(results.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      console.error("Global search error:", error);
    } finally {
      setSearching(false);
    }
  }

  if (isLoading || (isAdminAuthed && !dataReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingDots />
      </div>
    );
  }

  if (isExpired) return <ExpiredAccountScreen onLogout={adminLogout} />;
  if (!isAdminAuthed) return <AdminLoginScreen />;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-72 bg-background border-r border-white/10 overflow-y-auto z-30 flex flex-col">
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-muted-bg">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || "Admin"} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted text-sm font-medium">
                    {user?.name?.charAt(0) || "A"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold">{settings?.adminPortalTitle || "MubaristaHub Overview"}</p>
                <p className="text-xs text-muted">{settings?.adminPortalSubtitle || "Full CMS Control"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-foreground transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-yellow" />
                ) : (
                  <Moon className="h-4 w-4 text-blue" />
                )}
              </button>
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-foreground transition-colors"
                title="Global Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {visibleSections.map((s) => {
            const active = s.href === "/mbhubteam" ? pathname === s.href : pathname.startsWith(s.href);
            const isApplicants = s.href === "/mbhubteam/applications";
            const isMessages = s.href === "/mbhubteam/messages";
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-blue text-white"
                    : "text-muted hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <s.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{s.label}</span>
                {isApplicants && pendingApplicantsCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red px-1.5 text-[10px] font-bold text-white">
                    {pendingApplicantsCount > 99 ? "99+" : pendingApplicantsCount}
                  </span>
                )}
                {isMessages && unreadMessagesCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red px-1.5 text-[10px] font-bold text-white">
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                )}
                {active && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors py-1"
          >
            <Home className="h-3.5 w-3.5" />
            Back to Site
          </Link>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 text-xs text-red/70 hover:text-red transition-colors py-1 w-full"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-72 p-8 min-h-screen">
        {children}
      </main>

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search className="h-5 w-5 text-muted" />
              <input
                type="text"
                placeholder="Search sections, tools, books, articles... (⌘K)"
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  performGlobalSearch(e.target.value);
                }}
                autoFocus
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button
                onClick={() => {
                  setShowGlobalSearch(false);
                  setGlobalSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-1 rounded hover:bg-white/5 text-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-2">
              {searching ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingDots />
                </div>
              ) : searchResults.length === 0 && globalSearchQuery ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">No results found</p>
                </div>
              ) : searchResults.length === 0 && !globalSearchQuery ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">Type to search sections, tools, books, articles, and more</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((result, index) => (
                    <Link
                      key={index}
                      href={result.href}
                      onClick={() => {
                        setShowGlobalSearch(false);
                        setGlobalSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue/10">
                        <result.icon className="h-5 w-5 text-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{result.name}</p>
                          <span className="px-2 py-0.5 rounded-full bg-muted-bg text-xs text-muted">
                            {result.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted truncate">{result.subtitle}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-white/10">
            <h2 className="text-lg font-bold mb-2">Confirm Sign Out</h2>
            <p className="text-sm text-muted mb-6">Are you sure you want to sign out of the admin portal? Your regular user session will remain active.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-muted-bg text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await adminLogout();
                  setShowLogoutConfirm(false);
                  router.push("/");
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red text-white hover:bg-red/90 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey="admin-theme">
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ThemeProvider>
  );
}
