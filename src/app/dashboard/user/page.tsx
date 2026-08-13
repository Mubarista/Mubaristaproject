"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Trophy,
  Package,
  BookOpen,
  ShoppingBag,

  User,
  Crown,
  Shield,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { type SubscriptionPlan } from "@/lib/admin-data-context";
import { SubscribePrompt } from "@/components/subscribe-prompt";
import { initiateRwandaPay, generateReference } from "@/lib/payment";
import {
  DashboardStatsSkeleton,
  DashboardActivitySkeleton,
  DashboardQuickActionsSkeleton,
  SubscriptionPlanSkeleton,
  SkeletonButton,
  useDelayedLoading,
} from "@/components/ui/skeleton";

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
  const { user, isLoading, isPremium, cancelSubscription, logout } = useAuth();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [joinedCompetitionsCount, setJoinedCompetitionsCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [startingPlan, setStartingPlan] = useState<string | null>(null);

  // Ensure skeletons show for a minimum duration to prevent flash
  const showStatsSkeleton = useDelayedLoading(!loadingStats, 700);
  const showActivitiesSkeleton = useDelayedLoading(!loadingActivities, 900);
  const showPlansSkeleton = useDelayedLoading(!loadingPlans, 600);



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
  }, []);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchActivities() {
      setLoadingActivities(true);
      try {
        const response = await fetch(`/api/user/activities?userId=${userId}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data as Activity[]);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoadingActivities(false);
      }
    }

    async function fetchDashboardData() {
      setLoadingStats(true);
      try {
        const [applicationsRes, ordersRes, joinedRes] = await Promise.all([
          supabase
            .from("competition_applications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("payments")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("competition_applications")
            .select("competition_id")
            .eq("user_id", userId),
        ]);

        setApplicationCount(applicationsRes.count || 0);
        setOrderCount(ordersRes.count || 0);
        const joinedCompetitions = new Set((joinedRes.data || []).map((row: any) => row.competition_id).filter(Boolean));
        setJoinedCompetitionsCount(joinedCompetitions.size);

        if (applicationsRes.error) console.error("Applications fetch error:", applicationsRes.error);
        if (ordersRes.error) console.error("Orders fetch error:", ordersRes.error);
        if (joinedRes.error) console.error("Joined competitions fetch error:", joinedRes.error);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }

      await fetchActivities();
    }

    fetchDashboardData();
  }, [user?.id]);

  const stats = [
    {
      label: "Applications",
      value: loadingStats ? "..." : applicationCount,
      icon: FileText,
      color: "text-blue",
    },
    {
      label: "Competitions",
      value: loadingStats ? "..." : joinedCompetitionsCount,
      icon: Trophy,
      color: "text-yellow",
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
      action: () => setShowSubscriptionModal(true),
    },
  ];

  const quickActions = [
    { icon: FileText, title: "My Applications", desc: "View your competition entries", link: "/dashboard/user/applications" },
    { icon: Trophy, title: "Browse Competitions", desc: "Discover live competitions", link: "/competitions" },
    { icon: Package, title: "Order History", desc: "View past purchases", link: "/orders" },
    { icon: User, title: "My Profile", desc: "Update your profile", link: "/settings/profile" },
    { icon: MessageSquare, title: "Messages", desc: "View your messages", link: "/settings/notifications" },
    { icon: BookOpen, title: "Shop E-Books", desc: "Browse coffee e-books", link: "/books" },
    { icon: ShoppingBag, title: "Shop Tools", desc: "Professional equipment", link: "/tools" },
  ];

  function getActivityMeta(activity: Activity) {
    switch (activity.type) {
      case "competition":
        return { icon: Trophy, title: activity.description || "Competition payment", color: "text-blue", bg: "bg-blue/10" };
      case "subscription":
        return { icon: Crown, title: activity.description || "Subscription payment", color: "text-yellow", bg: "bg-yellow/10" };
      case "book":
        return { icon: BookOpen, title: activity.description || "E-Book order", color: "text-green", bg: "bg-green/10" };
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
    router.push("/mbhubteam");
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

        <SubscribePrompt />

        {/* Stats */}
        {showStatsSkeleton ? (
          <div className="mb-8">
            <DashboardStatsSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 skeleton-fade-in">
            {stats.map((stat) => (
              <div key={stat.label}>
                {stat.link ? (
                  <Link href={stat.link}>
                    <Card className="text-center cursor-pointer hover:border-blue/50 transition-colors">
                      <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted">{stat.label}</p>
                    </Card>
                  </Link>
                ) : stat.action ? (
                  <Card className="text-center cursor-pointer hover:border-blue/50 transition-colors" onClick={stat.action}>
                    <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </Card>
                ) : (
                  <Card className="text-center cursor-default">
                    <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-3">
            <CardTitle className="mb-4">Quick Actions</CardTitle>
            {showStatsSkeleton ? (
              <DashboardQuickActionsSkeleton />
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 skeleton-fade-in">
              {quickActions.map((item) => (
                <Link key={item.title} href={item.link}>
                  <Card className="cursor-pointer hover:border-blue/50 transition-colors p-4">
                    <item.icon className="h-6 w-6 text-blue mb-2" />
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <p className="text-sm text-muted">{item.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardTitle className="mb-4">Recent Activity</CardTitle>
          {showActivitiesSkeleton ? (
            <DashboardActivitySkeleton count={3} />
          ) : (
          <>
            <div
              className={`space-y-3 skeleton-fade-in ${
                showAllActivities && activities.length > 3
                  ? "max-h-[420px] overflow-y-auto pr-1"
                  : ""
              }`}
            >
              {activities.length > 0 ? (
                (showAllActivities ? activities : activities.slice(0, 3)).map((activity) => {
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
            {activities.length > 3 && (
              <div className="mt-4 text-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAllActivities((s) => !s)}
                >
                  {showAllActivities ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show all ({activities.length - 3} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
          )}
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
            {isLoading ? (
              <SkeletonButton />
            ) : user?.emailVerified ? (
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
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md w-full p-6">
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <CardTitle className="mb-2">Confirm Logout</CardTitle>
                  <p className="text-muted mb-6">Are you sure you want to log out of your account?</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="flex gap-3"
                >
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
                </motion.div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSubscriptionModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="relative max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow via-green to-blue rounded-t-2xl" />

                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="flex justify-between items-center mb-6"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow/15"
                    >
                      <Crown className="h-5 w-5 text-yellow" />
                    </motion.div>
                    <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
                  </div>
                  <Button variant="ghost" onClick={() => setShowSubscriptionModal(false)}>
                    ✕
                  </Button>
                </motion.div>

                {isPremium && user?.subscriptionPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="mb-6 p-4 bg-blue/5 border border-blue/20 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-blue">Current subscription active</p>
                      <p className="text-sm text-muted">
                        Expires: {user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : "N/A"}
                      </p>
                      <p className="text-sm text-yellow">
                        Your subscription will not auto-renew. Please pay again after it expires to keep premium access.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {!isPremium && (showPlansSkeleton ? (
                    <>
                      <SubscriptionPlanSkeleton />
                      <SubscriptionPlanSkeleton />
                      <SubscriptionPlanSkeleton />
                    </>
                  ) : (
                  subscriptionPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 24, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.35, ease: "easeOut" }}
                    >
                      <Card
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
                      disabled={startingPlan === plan.id}
                      onClick={async () => {
                      if (!user) return;
                      setStartingPlan(plan.id);
                      try {
                        const tx_ref = generateReference(`PREM-${plan.id}`);
                        const { payment_url } = await initiateRwandaPay({
                          amount: plan.price,
                          tx_ref,
                          customer: {
                            name: user.name,
                            email: user.email,
                            phone: user.phone || "",
                          },
                          currency: plan.currency,
                          description: `Premium subscription - ${plan.name}`,
                          meta: {
                            type: "premium_subscription",
                            planId: plan.id,
                            duration: plan.duration,
                            userId: user.id,
                            userCountry: user.country,
                            userName: user.name,
                            userEmail: user.email,
                          },
                        });

                        window.location.href = payment_url;
                      } catch (error: any) {
                        console.error("Failed to start payment:", error);
                        alert(error.message || "Failed to start payment.");
                        setStartingPlan(null);
                      }
                    }}
                    >
                      {startingPlan === plan.id ? "Processing..." : `Choose ${plan.name}`}
                    </Button>
                      </Card>
                    </motion.div>
                  ))
                  ))}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
