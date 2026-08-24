"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Crown, Check, ArrowRight, Star, Loader2 } from "lucide-react";
import { useAdminData } from "@/lib/admin-data-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RwandaPayGateway } from "@/components/payment/rwandapay-gateway";

export default function PremiumPage() {
  const { subscriptionPlans } = useAdminData();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showGateway, setShowGateway] = useState(false);
  const [completing, setCompleting] = useState(false);

  const activePlans = subscriptionPlans.filter(p => p.active);

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      alert("Please login to upgrade to premium");
      return;
    }

    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) return;

    setSelectedPlan(plan);
    setShowGateway(true);
  };

  async function handleGatewayComplete(paymentReference: string, providerReference?: string) {
    setCompleting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/payments/rwandapay/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          reference: providerReference || paymentReference,
          paymentReference,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to complete payment" }));
        throw new Error(err.error || "Failed to complete payment");
      }

      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("Premium completion failed:", error);
      alert(error.message || "Failed to confirm payment. Please contact support.");
      setCompleting(false);
    }
  }

  function handleGatewayCancel() {
    setShowGateway(false);
    setSelectedPlan(null);
    setCompleting(false);
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm mb-6"
          >
            <Crown className="h-4 w-4 text-yellow" />
            Premium Membership
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Choose the perfect plan to elevate your barista journey with exclusive features and premium content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {activePlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-8 relative h-full ${
                plan.popular ? "border-2 border-blue shadow-lg shadow-blue/20" : ""
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="blue" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{formatCurrency(plan.price, plan.currency || "RWF")}</span>
                    <span className="text-muted">/{plan.duration}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Check className="h-4 w-4 text-green flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "primary" : "secondary"}
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={completing || user?.subscriptionPlan === plan.id}
                >
                  {completing && selectedPlan?.id === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : user?.subscriptionPlan === plan.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Active
                    </>
                  ) : (
                    <>
                      Choose Plan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-3xl mx-auto p-8">
            <h3 className="text-2xl font-semibold mb-4">Why Go Premium?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <Crown className="h-8 w-8 text-yellow mb-3" />
                <h4 className="font-semibold mb-2">Exclusive Access</h4>
                <p className="text-sm text-muted">
                  Get access to premium competitions, learning materials, and expert content.
                </p>
              </div>
              <div>
                <Star className="h-8 w-8 text-blue mb-3" />
                <h4 className="font-semibold mb-2">Priority Support</h4>
                <p className="text-sm text-muted">
                  Get faster response times and dedicated support for all your queries.
                </p>
              </div>
              <div>
                <Check className="h-8 w-8 text-green mb-3" />
                <h4 className="font-semibold mb-2">Save Money</h4>
                <p className="text-sm text-muted">
                  Enjoy discounts on tools, books, and competition entries.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted mb-4">Already have a premium account?</p>
          <Link href="/dashboard">
            <Button variant="secondary">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {showGateway && selectedPlan && user && (
        <RwandaPayGateway
          amount={selectedPlan.price}
          currency={selectedPlan.currency || "RWF"}
          description={`Premium subscription - ${selectedPlan.name}`}
          customerName={user.name}
          customerEmail={user.email}
          defaultPhone={user.phone || ""}
          meta={{
            type: "premium_subscription",
            planId: selectedPlan.id,
            duration: selectedPlan.duration,
            userId: user.id,
            userCountry: user.country,
            userName: user.name,
            userEmail: user.email,
          }}
          onComplete={handleGatewayComplete}
          onCancel={handleGatewayCancel}
        />
      )}
    </div>
  );
}
