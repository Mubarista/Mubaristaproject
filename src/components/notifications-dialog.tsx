"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Mail,
  Check,
  CreditCard,
  Crown,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Trophy,
  BookOpen,
  Megaphone,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  created_at: string;
}

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRead?: () => void;
}

export function NotificationsDialog({
  open,
  onOpenChange,
  onRead,
}: NotificationsDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  useEffect(() => {
    if (!open || !user) return;

    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    const channel = supabase
      .channel(`notifications-dialog-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: "is_global=eq.true" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [open, user?.id]);

  async function fetchNotifications() {
    if (!user) return;

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications((data.notifications || []).map((n: any) => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          link: n.link,
          created_at: n.created_at,
        })));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    const token = await getToken();
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        onRead?.();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAllAsRead() {
    if (!user) return;
    const token = await getToken();
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        onRead?.();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  function handleClick(notification: Notification) {
    if (!notification.read) markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
      onOpenChange(false);
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case "welcome":
      case "article":
      case "coffee_fact":
      case "school":
        return <Mail className="h-5 w-5" />;
      case "competition":
      case "competition_status":
        return <Trophy className="h-5 w-5" />;
      case "order":
      case "purchase":
        return <Check className="h-5 w-5" />;
      case "premium":
      case "subscription":
        return <Crown className="h-5 w-5" />;
      case "payment":
        return <CreditCard className="h-5 w-5" />;
      case "security":
      case "password":
        return <Shield className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "confirmation":
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "ebook":
        return <BookOpen className="h-5 w-5" />;
      case "announcement":
      case "global":
        return <Megaphone className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  }

  function getIconClass(type: string) {
    const map: Record<string, string> = {
      welcome: "bg-blue/10 text-blue",
      article: "bg-blue/10 text-blue",
      coffee_fact: "bg-blue/10 text-blue",
      school: "bg-yellow/10 text-yellow",
      competition: "bg-yellow/10 text-yellow",
      competition_status: "bg-yellow/10 text-yellow",
      order: "bg-green/10 text-green",
      purchase: "bg-green/10 text-green",
      ebook: "bg-green/10 text-green",
      premium: "bg-purple/10 text-purple",
      subscription: "bg-purple/10 text-purple",
      payment: "bg-blue/10 text-blue",
      security: "bg-cyan/10 text-cyan",
      password: "bg-cyan/10 text-cyan",
      warning: "bg-red/10 text-red",
      confirmation: "bg-green/10 text-green",
      success: "bg-green/10 text-green",
      announcement: "bg-muted-bg text-muted",
      global: "bg-muted-bg text-muted",
    };
    return map[type] || "bg-muted-bg text-muted";
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto glass-card rounded-2xl p-6"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted-bg hover:bg-white/10 flex items-center justify-center transition-colors z-10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Notifications</h2>
                <p className="text-muted text-sm">
                  Stay updated on purchases, competitions, and more
                </p>
              </div>
              {notifications.some((n) => !n.read) && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingDots />
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Bell className="h-12 w-12 text-muted mx-auto mb-4" />
                    <CardTitle className="mb-2">No notifications</CardTitle>
                    <CardDescription>You are all caught up!</CardDescription>
                  </Card>
                ) : (
                  notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      onClick={() => handleClick(notification)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-white/5 ${
                        !notification.read ? "border-blue" : ""
                      } ${notification.link ? "hover:border-blue/50" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getIconClass(notification.type)}`}
                        >
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle className="text-base mb-1">
                                {notification.title}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {notification.message}
                              </CardDescription>
                            </div>
                            {!notification.read && (
                              <Badge variant="blue" className="shrink-0">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="shrink-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
