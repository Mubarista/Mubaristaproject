"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, BookOpen, Wrench, Trophy, Crown } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Payment {
  id: string;
  type?: string;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string;
  method?: string;
  createdAt?: string;
  paidAt?: string | null;
  competitionTitle?: string | null;
}

function capitalize(str?: string | null) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatMethod(method?: string | null) {
  if (!method) return "—";
  return method
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}

function getPaymentIcon(type?: string | null) {
  switch (type) {
    case "book":
      return <BookOpen className="h-6 w-6 text-blue" />;
    case "tool":
      return <Wrench className="h-6 w-6 text-yellow" />;
    case "competition":
      return <Trophy className="h-6 w-6 text-yellow" />;
    case "subscription":
      return <Crown className="h-6 w-6 text-green" />;
    default:
      return <Package className="h-6 w-6 text-muted" />;
  }
}

function getPaymentTitle(payment: Payment) {
  return (
    payment.description ||
    payment.competitionTitle ||
    (payment.type ? `${capitalize(payment.type)} payment` : "Payment")
  );
}

function getStatusVariant(status?: string | null): "green" | "yellow" | "red" | "blue" {
  switch (status) {
    case "completed":
    case "paid":
      return "green";
    case "pending":
    case "unpaid":
      return "yellow";
    case "failed":
    case "cancelled":
      return "red";
    default:
      return "blue";
  }
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchPayments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/payments?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`
        );
        if (!response.ok) throw new Error("Failed to fetch payments");
        const data = (await response.json()) as Payment[];
        if (!cancelled) setPayments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching payments:", error);
        if (!cancelled) setPayments([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPayments();
    const interval = setInterval(fetchPayments, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const showLoading = authLoading || (isLoading && payments.length === 0);
  const showEmpty = !authLoading && !isLoading && payments.length === 0;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order History</h1>
          <p className="text-muted">Track and manage your orders</p>
        </div>

        {showLoading ? (
          <Card className="text-center py-16">
            <LoadingDots />
            <CardTitle className="mb-2">Loading orders...</CardTitle>
            <p className="text-muted">Please wait while we fetch your orders</p>
          </Card>
        ) : showEmpty ? (
          <Card className="text-center py-16">
            <Package className="h-16 w-16 text-muted mx-auto mb-4" />
            <CardTitle className="mb-2">No orders yet</CardTitle>
            <p className="text-muted mb-6">Start shopping to see your orders here</p>
            <Button variant="primary" onClick={() => (window.location.href = "/tools")}>
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted-bg flex items-center justify-center">
                        {getPaymentIcon(payment.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{getPaymentTitle(payment)}</h3>
                        <p className="text-sm text-muted">
                          {payment.createdAt
                            ? new Date(payment.createdAt).toLocaleDateString()
                            : "—"}
                          {payment.method ? ` • ${formatMethod(payment.method)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={getStatusVariant(payment.status)}
                        className="capitalize"
                      >
                        {payment.status || "Unknown"}
                      </Badge>
                      <p className="font-bold">
                        {formatCurrency(payment.amount || 0, payment.currency || "RWF")}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
