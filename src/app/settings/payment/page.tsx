"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Plus, Trash2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";

interface PaymentMethod {
  id: string;
  userId: string;
  type: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string | null;
  isDefault: boolean;
  stripePaymentMethodId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentMethodPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  async function fetchPaymentMethods() {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/payment-methods?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  }

  async function setDefault(id: string) {
    try {
      const res = await fetch("/api/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      if (res.ok) {
        setPaymentMethods(paymentMethods.map(pm => 
          pm.id === id ? { ...pm, isDefault: true } : { ...pm, isDefault: false }
        ));
      }
    } catch (error) {
      console.error("Error setting default payment method:", error);
    }
  }

  async function removeMethod(id: string) {
    try {
      const res = await fetch(`/api/payment-methods?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
      }
    } catch (error) {
      console.error("Error removing payment method:", error);
    }
  }

  async function addPaymentMethod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setAdding(true);
    try {
      const formData = new FormData(e.currentTarget);
      const cardNumber = formData.get("cardNumber") as string;
      const expiryDate = formData.get("expiryDate") as string;
      const cvc = formData.get("cvc") as string;

      // Parse card number to get last 4 and type
      const last4 = cardNumber.slice(-4);
      const type = cardNumber.startsWith("4") ? "visa" : 
                   cardNumber.startsWith("5") ? "mastercard" : 
                   cardNumber.startsWith("3") ? "amex" : "card";

      // Parse expiry date
      const [expiryMonth, expiryYear] = expiryDate.split("/").map(Number);

      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type,
          last4,
          expiryMonth,
          expiryYear,
        }),
      });

      if (res.ok) {
        await fetchPaymentMethods();
        setShowAddForm(false);
        e.currentTarget.reset();
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
    } finally {
      setAdding(false);
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
        <Link href="/settings" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Payment Methods</h1>
            <p className="text-muted text-sm">Manage your payment methods for subscriptions and purchases</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted mx-auto mb-4" />
              <CardTitle className="mb-2">No payment methods</CardTitle>
              <CardDescription>Add a payment method to make purchases</CardDescription>
            </Card>
          ) : (
            paymentMethods.map((method) => (
              <Card key={method.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base capitalize">{method.type}</CardTitle>
                        {method.isDefault && <Badge variant="green">Default</Badge>}
                      </div>
                      <CardDescription className="text-sm">
                        •••• {method.last4} • Expires {method.expiryMonth}/{method.expiryYear}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefault(method.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMethod(method.id)}
                      className="text-red hover:text-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {showAddForm && (
          <Card className="p-6 mt-6">
            <CardTitle className="mb-4">Add Payment Method</CardTitle>
            <form onSubmit={addPaymentMethod} className="space-y-4">
              <div>
                <label className="text-sm text-muted mb-1.5 block">Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="4242 4242 4242 4242"
                  required
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Expiry Date</label>
                  <input
                    type="text"
                    name="expiryDate"
                    placeholder="MM/YY"
                    required
                    className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1.5 block">CVC</label>
                  <input
                    type="text"
                    name="cvc"
                    placeholder="123"
                    required
                    className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={adding} className="flex-1">
                  {adding ? "Adding..." : "Add Card"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
