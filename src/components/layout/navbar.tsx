"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  ShoppingBag,
  Settings,
  Bell,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { navLinks } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [siteLogo, setSiteLogo] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchSiteSettings();
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  async function fetchSiteSettings() {
    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        const data = await res.json();
        setSiteLogo(data.logo || "");
      }
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  }

  async function fetchUnreadCount() {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&unreadOnly=true`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }

  const scrolled = scrollY > 20;
  // Clamp 0–1 over first 120px of scroll
  const scrollProgress = Math.min(scrollY / 120, 1);
  const blurPx = Math.round(8 + scrollProgress * 24);   // 8px → 32px
  const bgOpacity = (0.7 + scrollProgress * 0.25).toFixed(2); // 0.70 → 0.95

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "py-3 shadow-2xl" : "py-5"
      )}
      style={{
        transition: "background-color 0.3s ease, border-color 0.3s ease",
        backdropFilter: scrolled ? `blur(${blurPx}px) saturate(160%)` : undefined,
        WebkitBackdropFilter: scrolled ? `blur(${blurPx}px) saturate(160%)` : undefined,
        backgroundColor: `rgba(var(--navbar-bg-rgb, 10,10,10), ${bgOpacity})`,
        borderBottom: scrolled ? "1px solid rgba(128,128,128,0.15)" : "1px solid transparent",
      }}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 group cursor-pointer" title="Go to Home">
            {siteLogo ? (
              <img src={siteLogo} alt="MUBARISTA" className="h-14 w-auto bg-transparent transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2 cursor-pointer" />
            ) : null}
            <span className="text-xl font-bold tracking-tight leading-none animate-gradient-text">
              MUBARISTA
              <span className="text-[0.45em] tracking-widest uppercase align-top ml-0.5">HUB</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.slice(0, 6).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-lg hover:bg-white/5">
                More <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 glass-card rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {navLinks.slice(6).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-yellow" />
                ) : (
                  <Moon className="h-5 w-5 text-blue" />
                )}
              </button>
            )}

            {user ? (
              <div className="hidden sm:flex items-center gap-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar}
                        alt={user.name || "Profile"}
                        className="h-6 w-6 rounded-full object-cover mr-1"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {user.name.split(' ')[0]}
                  </Button>
                </Link>
                <Link href="/settings/notifications" className="relative">
                  <Button variant="ghost" size="sm">
                    <Bell className="h-4 w-4" />
                  </Button>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/cart" className="relative">
                  <Button variant="ghost" size="sm">
                    <ShoppingBag className="h-4 w-4" />
                  </Button>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setShowLogoutConfirm(true)}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            <button
              className="lg:hidden p-2 rounded-xl hover:bg-white/5"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 glass-card rounded-2xl overflow-hidden"
            >
              <div className="p-4 space-y-1 max-h-[70vh] overflow-y-auto">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 flex flex-col gap-2 border-t border-white/10">
                  {!user ? (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        <Button variant="primary" className="w-full">
                          Register
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button variant="primary" className="w-full">
                          {user.name.split(' ')[0]}
                        </Button>
                      </Link>
                      <Link href="/cart" onClick={() => setIsOpen(false)} className="relative">
                        <Button variant="ghost" className="w-full">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Cart
                        </Button>
                        {cartCount > 0 && (
                          <span className="absolute top-2 right-2 h-5 w-5 bg-red text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {cartCount > 9 ? '9+' : cartCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Dialog */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-white/10">
              <h2 className="text-lg font-bold mb-2">Confirm Logout</h2>
              <p className="text-sm text-muted mb-6">Are you sure you want to log out of your account?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-muted-bg text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setShowLogoutConfirm(false);
                    router.push("/");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red text-white hover:bg-red/90 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
