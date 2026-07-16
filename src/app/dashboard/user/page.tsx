"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Trophy,
  Package,
  BookOpen,
  ShoppingBag,
  CreditCard,
  User,
  Crown,
  Shield,
  MessageSquare,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { type SubscriptionPlan } from "@/lib/admin-data-context";

interface Activity {
  id: string;
  type?: string;
  description?: string | null;
  status?: string;
  createdAt?: string;
  amount?: number;
  currency?: string;
}

export default function UserDashboard() {
  const { user, isPremium, upgradeToPremium, logout } = useAuth();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [liveCompetitionCount, setLiveCompetitionCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const competitionCount = applicationCount + liveCompetitionCount;

  useEffect(() => {
    async function fetchPlans() {
      setLoadingPlans(true);
      try {
        const response = await fetch("/api/subscription-plans");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionPlans(data as SubscriptionPlan[]);
        }
      } catch (error) {
        console.error("Failed to fetch subscription plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    }

    fetchPlans();

    const interval = setInterval(() => {
      fetchPlans();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchActivities() {
      try {
        const response = await fetch(`/api/user/activities?userId=${userId}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data as Activity[]);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      }
    }

    async function fetchDashboardData() {
      setLoadingStats(true);
      try {
        const [applicationsRes, ordersRes, competitionsRes] = await Promise.all([
          supabase
            .from("competition_applications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("payments")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("competitions")
            .select("*", { count: "exact", head: true })
            .in("status", ["open", "judging"]),
        ]);

        setApplicationCount(applicationsRes.count || 0);
        setOrderCount(ordersRes.count || 0);
        setLiveCompetitionCount(competitionsRes.count || 0);

        if (applicationsRes.error) console.error("Applications fetch error:", applicationsRes.error);
        if (ordersRes.error) console.error("Orders fetch error:", ordersRes.error);
        if (competitionsRes.error) console.error("Competitions fetch error:", competitionsRes.error);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }

      await fetchActivities();
    }

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const stats = [
    {
      label: "Applications",
      value: loadingStats ? "..." : applicationCount,
      icon: FileText,
      color: "text-blue",
      link: "/competitions",
    },
    {
      label: "Competitions",
      value: loadingStats ? "..." : competitionCount,
      icon: Trophy,
      color: "text-yellow",
      link: "/competitions",
    },
    {
      label: "Orders",
      value: loadingStats ? "..." : orderCount,
      icon: Package,
      color: "text-green",
      link: "/orders",
    },
    {
      label: "Premium",
      value: isPremium ? "Active" : "Upgrade",
      icon: Crown,
      color: isPremium ? "text-yellow" : "text-muted",
      action: () => upgradeToPremium("premium", "monthly"),
    },
  ];

  const quickActions = [
    { icon: FileText, title: "My Applications", desc: "View your competition entries", link: "/dashboard/user/applications" },
    { icon: Trophy, title: "Browse Competitions", desc: "Discover live competitions", link: "/competitions" },
    { icon: Package, title: "Order History", desc: "View past purchases", link: "/orders" },
    { icon: CreditCard, title: "Payment Methods", desc: "Manage your cards", link: "/settings/payment" },
    { icon: MapPin, title: "My Addresses", desc: "Manage delivery & pickup", link: "/settings/profile" },
    { icon: User, title: "My Profile", desc: "Update your profile", link: "/settings/profile" },
    { icon: MessageSquare, title: "Messages", desc: "View your messages", link: "/settings/notifications" },
    { icon: BookOpen, title: "Shop Books", desc: "Browse coffee books", link: "/books" },
    { icon: ShoppingBag, title: "Shop Tools", desc: "Professional equipment", link: "/tools" },
  ];

  function getActivityMeta(activity: Activity) {
    switch (activity.type) {
      case "competition":
        return { icon: Trophy, title: activity.description || "Competition payment", color: "text-blue", bg: "bg-blue/10" };
      case "subscription":
        return { icon: Crown, title: activity.description || "Subscription payment", color: "text-yellow", bg: "bg-yellow/10" };
      case "book":
        return { icon: BookOpen, title: activity.description || "Book order", color: "text-green", bg: "bg-green/10" };
      case "tool":
        return { icon: ShoppingBag, title: activity.description || "Tool order", color: "text-yellow", bg: "bg-yellow/10" };
      default:
        return { icon: Package, title: activity.description || "Payment", color: "text-muted", bg: "bg-muted-bg" };
    }
  }

  function getStatusVariant(status: string | undefined): "green" | "yellow" | "red" | "blue" {
    const map: Record<string, "green" | "yellow" | "red" | "blue"> = {
      completed: "green",
      paid: "green",
      pending: "yellow",
      unpaid: "yellow",
      failed: "red",
      cancelled: "red",
    };
    return map[(status || "").toLowerCase()] || "blue";
  }

  if (!user) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Please log in to access your account</p>
      </div>
    );
  }

  // Redirect admin users to admin panel
  if (user.role === "admin") {
    router.push("/muba2-admin");
    return null;
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user.name}
            </h1>
            <p className="text-muted">Manage your account and explore our offerings</p>
          </div>
          <div className="flex gap-3">
            {!isPremium && (
              <Button variant="premium" onClick={() => setShowSubscriptionModal(true)}>
                <Crown className="h-4 w-4" /> Upgrade to Premium
              </Button>
            )}
            {isPremium && <Badge variant="premium">Premium Member</Badge>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {stat.link ? (
                <Link href={stat.link}>
                  <Card className="text-center cursor-pointer hover:border-blue/50 transition-colors">
                    <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </Card>
                </Link>
              ) : (
                <Card className="text-center cursor-pointer hover:border-blue/50 transition-colors" onClick={stat.action}>
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </Card>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-3">
            <CardTitle className="mb-4">Quick Actions</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.slice(0, 4).map((item) => (
                <Link key={item.title} href={item.link}>
                  <Card className="cursor-pointer hover:border-blue/50 transition-colors p-4">
                    <item.icon className="h-6 w-6 text-blue mb-2" />
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <p className="text-sm text-muted">{item.desc}</p>
                  </Card>
                </Link>
              ))}
              {/* More button with dropdown */}
              <div className="relative z-50">
                <Card
                  className="cursor-pointer hover:border-blue/50 transition-colors p-4"
                  onClick={() => setShowMore(!showMore)}
                >
                  <ChevronDown className="h-6 w-6 text-blue mb-2" />
                  <CardTitle className="text-base">More</CardTitle>
                  <p className="text-sm text-muted">View all actions</p>
                </Card>
                {/* Dropdown menu */}
                {showMore && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-background rounded-xl shadow-2xl border border-white/10 z-50">
                    <div className="p-2">
                      {quickActions.slice(4).map((item) => (
                        <Link
                          key={item.title}
                          href={item.link}
                          onClick={() => setShowMore(false)}
                        >
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted-bg transition-colors">
                            <item.icon className="h-5 w-5 text-blue" />
                            <div>
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-xs text-muted">{item.desc}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardTitle className="mb-4">Recent Activity</CardTitle>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity) => {
                const meta = getActivityMeta(activity);
                const Icon = meta.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted-bg">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${meta.bg}`}>
                      <Icon className={`h-5 w-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{meta.title}</p>
                      <p className="text-xs text-muted">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : "—"}
                      </p>
                    </div>
                    {activity.status && (
                      <Badge variant={getStatusVariant(activity.status)}>
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted">
                No recent activity
              </div>
            )}
          </div>
        </Card>

        {/* Verification Prompt Banner */}
        <Card className="mt-6 bg-gradient-to-r from-blue/10 to-purple/10 border-blue/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue" /> Secure Your Account
              </CardTitle>
              <p className="text-sm text-muted mt-1">
                Verify your account for enhanced security
              </p>
            </div>
            {user?.emailVerified ? (
              <Button variant="secondary" disabled className="bg-green/10 text-green border-green/30">
                ✓ Verified
              </Button>
            ) : (
              <Link href="/settings/security">
                <Button variant="primary">
                  Verify Now
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Premium Banner */}
        {!isPremium && (
          <Card className="mt-6 bg-gradient-to-r from-yellow/10 to-orange/10 border-yellow/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow" /> Unlock Premium Learning
                </CardTitle>
                <p className="text-sm text-muted mt-1">
                  Get access to exclusive courses, certifications, and advanced learning content
                </p>
              </div>
              <Button variant="premium" onClick={() => setShowSubscriptionModal(true)}>
                Upgrade Now
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <CardTitle className="mb-2">Confirm Logout</CardTitle>
            <p className="text-muted mb-6">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  await logout();
                  setShowLogoutConfirm(false);
                  router.push("/");
                }}
                className="flex-1"
              >
                Logout
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
              <Button variant="ghost" onClick={() => setShowSubscriptionModal(false)}>
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`p-4 cursor-pointer transition-all ${
                    plan.popular ? "border-yellow border-2 bg-yellow/5" : "hover:border-blue/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="text-center mb-2">
                      <Badge variant="premium">Most Popular</Badge>
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-3xl font-bold text-blue mt-2">
                      {formatCurrency(plan.price, plan.currency || "RWF")}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="text-sm text-muted flex items-center gap-2">
                        <span className="text-green">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "premium" : "primary"}
                    className="w-full"
                    onClick={() => {
                      upgradeToPremium(plan.id, plan.duration as "weekly" | "monthly" | "yearly");
                      setShowSubscriptionModal(false);
                    }}
                  >
                    Choose {plan.name}
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
