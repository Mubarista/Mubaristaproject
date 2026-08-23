"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, Check, CreditCard, Crown, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
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

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

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
          userId: n.user_id,
          title: n.title,
          description: n.message || n.description,
          type: n.type,
          read: n.read,
          metadata: n.data ? JSON.stringify(n.data) : null,
          createdAt: n.created_at,
        })));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const token = await getToken();
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAllAsRead() {
    if (!user) return;

    try {
      const token = await getToken();
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="flex items-center justify-center py-12">
          <LoadingDots />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted text-sm">Manage your notification preferences and history</p>
          </div>
          {notifications.some(n => !n.read) && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted mx-auto mb-4" />
              <CardTitle className="mb-2">No notifications</CardTitle>
              <CardDescription>You're all caught up!</CardDescription>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className={`p-4 ${!notification.read ? 'border-blue' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    notification.type === 'welcome' ? 'bg-blue/10 text-blue' :
                    notification.type === 'competition' ? 'bg-yellow/10 text-yellow' :
                    notification.type === 'order' ? 'bg-green/10 text-green' :
                    notification.type === 'premium' ? 'bg-red/10 text-red' :
                    notification.type === 'payment' ? 'bg-blue/10 text-blue' :
                    notification.type === 'subscription' ? 'bg-purple/10 text-purple' :
                    notification.type === 'security' ? 'bg-cyan/10 text-cyan' :
                    notification.type === 'warning' ? 'bg-red/10 text-red' :
                    notification.type === 'confirmation' ? 'bg-green/10 text-green' :
                    'bg-muted-bg text-muted'
                  }`}>
                    {notification.type === 'welcome' && <Mail className="h-5 w-5" />}
                    {notification.type === 'competition' && <Bell className="h-5 w-5" />}
                    {notification.type === 'order' && <Check className="h-5 w-5" />}
                    {notification.type === 'premium' && <Crown className="h-5 w-5" />}
                    {notification.type === 'payment' && <CreditCard className="h-5 w-5" />}
                    {notification.type === 'subscription' && <Crown className="h-5 w-5" />}
                    {notification.type === 'security' && <Shield className="h-5 w-5" />}
                    {notification.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                    {notification.type === 'confirmation' && <CheckCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base mb-1">{notification.title}</CardTitle>
                        <CardDescription className="text-sm">{notification.description}</CardDescription>
                      </div>
                      {!notification.read && (
                        <Badge variant="blue" className="shrink-0">New</Badge>
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
      </div>
    </div>
  );
}
