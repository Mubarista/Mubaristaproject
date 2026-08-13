"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: string;
  read: boolean;
  metadata: string | null;
  createdAt: string;
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
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!open || !user) return;

    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [open, user?.id]);

  async function fetchNotifications() {
    if (!user) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
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

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        onRead?.();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
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
                  Manage your notification preferences and history
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
                    <CardDescription>You're all caught up!</CardDescription>
                  </Card>
                ) : (
                  notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`p-4 ${!notification.read ? "border-blue" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            notification.type === "welcome"
                              ? "bg-blue/10 text-blue"
                              : notification.type === "competition"
                              ? "bg-yellow/10 text-yellow"
                              : notification.type === "order"
                              ? "bg-green/10 text-green"
                              : notification.type === "premium"
                              ? "bg-red/10 text-red"
                              : notification.type === "payment"
                              ? "bg-blue/10 text-blue"
                              : notification.type === "subscription"
                              ? "bg-purple/10 text-purple"
                              : notification.type === "security"
                              ? "bg-cyan/10 text-cyan"
                              : notification.type === "warning"
                              ? "bg-red/10 text-red"
                              : notification.type === "confirmation"
                              ? "bg-green/10 text-green"
                              : "bg-muted-bg text-muted"
                          }`}
                        >
                          {notification.type === "welcome" && (
                            <Mail className="h-5 w-5" />
                          )}
                          {notification.type === "competition" && (
                            <Bell className="h-5 w-5" />
                          )}
                          {notification.type === "order" && (
                            <Check className="h-5 w-5" />
                          )}
                          {notification.type === "premium" && (
                            <Crown className="h-5 w-5" />
                          )}
                          {notification.type === "payment" && (
                            <CreditCard className="h-5 w-5" />
                          )}
                          {notification.type === "subscription" && (
                            <Crown className="h-5 w-5" />
                          )}
                          {notification.type === "security" && (
                            <Shield className="h-5 w-5" />
                          )}
                          {notification.type === "warning" && (
                            <AlertTriangle className="h-5 w-5" />
                          )}
                          {notification.type === "confirmation" && (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle className="text-base mb-1">
                                {notification.title}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {notification.description}
                              </CardDescription>
                            </div>
                            {!notification.read && (
                              <Badge variant="blue" className="shrink-0">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
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
