"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X, Loader2, Package, Crown, Trophy, CreditCard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type PaymentType = "tool_purchase" | "book_purchase" | "premium_subscription" | "competition_entry" | "";

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<string>("");
  const [reference, setReference] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("");
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("RWF");
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);
  const { clearCart } = useCart();

  useEffect(() => {
    if (typeof window === "undefined" || hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const rawStatus = params.get("status") || "successful";
    const rawReference = params.get("reference");
    const rawType = (params.get("type") || "") as PaymentType;
    const rawAmount = Number(params.get("amount")) || 0;
    const rawCurrency = params.get("currency") || "RWF";

    setStatus(rawStatus);
    setReference(rawReference);
    setPaymentType(rawType);
    setAmount(rawAmount);
    setCurrency(rawCurrency);

    if (rawStatus === "successful" || rawStatus === "success") {
      clearCart();
    }

    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue" />
          <p className="text-muted">Confirming your payment...</p>
        </Card>
      </div>
    );
  }

  const isSuccess = status === "successful" || status === "success";
  const paidAmount = formatCurrency(amount, currency);

  const messages: Record<string, { title: string; icon: React.ReactNode; body: React.ReactNode }> = {
    tool_purchase: {
      title: "Thank you!",
      icon: <Package className="h-8 w-8 text-green" />,
      body: (
        <>
          <p className="text-muted mb-2">Your order is being processed.</p>
          <p className="text-muted mb-4">You can track your shipment in your order history.</p>
        </>
      ),
    },
    book_purchase: {
      title: "Thank you!",
      icon: <Package className="h-8 w-8 text-green" />,
      body: (
        <>
          <p className="text-muted mb-2">Your books are being prepared for delivery.</p>
          <p className="text-muted mb-4">You will receive an email with your PDFs shortly.</p>
        </>
      ),
    },
    premium_subscription: {
      title: "Welcome to Premium!",
      icon: <Crown className="h-8 w-8 text-yellow" />,
      body: (
        <>
          <p className="text-muted mb-2">Thank you for subscribing.</p>
          <p className="text-muted mb-4">
            You paid <strong>{paidAmount}</strong> for premium access. Your subscription is now active.
          </p>
        </>
      ),
    },
    competition_entry: {
      title: "Application Fee Received!",
      icon: <Trophy className="h-8 w-8 text-green" />,
      body: (
        <>
          <p className="text-muted mb-2">Thank you for your payment.</p>
          <p className="text-muted mb-4">
            You paid <strong>{paidAmount}</strong>. Your nomination is being processed and you will receive access to the participant dashboard shortly.
          </p>
        </>
      ),
    },
    default: {
      title: "Thank you!",
      icon: <CreditCard className="h-8 w-8 text-green" />,
      body: (
        <>
          <p className="text-muted mb-2">Your payment has been received and is being processed.</p>
          {amount > 0 && (
            <p className="text-muted mb-4">
              Amount paid: <strong>{paidAmount}</strong>
            </p>
          )}
        </>
      ),
    },
  };

  const config = messages[paymentType] || messages.default;

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {config.icon}
            </div>
            <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
            {config.body}
            {reference && (
              <p className="text-sm text-muted mb-6">
                Reference: <strong>{reference}</strong>
              </p>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment not completed</h1>
            <p className="text-muted mb-6">
              We could not confirm your payment. If you completed the payment on RwandaPay, it may take a few moments to reflect in our system.
            </p>
          </>
        )}
        <Link href="/">
          <Button variant="primary" className="w-full">
            Continue
          </Button>
        </Link>
      </Card>
    </div>
  );
}
