"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X, Loader2, Package, Crown, Trophy, CreditCard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type PaymentRecord = {
  id?: string;
  type?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  description?: string;
  competitionTitle?: string;
  status?: string;
};

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<string>("");
  const [txRef, setTxRef] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);
  const { clearCart } = useCart();

  useEffect(() => {
    if (typeof window === "undefined" || hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const rawStatus = params.get("status") || "successful";
    const rawTxRef = params.get("tx_ref");
    const rawReference = params.get("reference");

    setStatus(rawStatus);
    setTxRef(rawTxRef || rawReference);

    async function loadPayment() {
      const refToUse = rawTxRef || rawReference;
      if (refToUse) {
        try {
          const res = await fetch(`/api/payments?reference=${encodeURIComponent(refToUse)}`);
          if (res.ok) {
            const data = (await res.json()) as PaymentRecord[];
            if (Array.isArray(data) && data.length > 0) {
              setPayment(data[0]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch payment:", err);
        }
      }

      if (rawStatus === "successful" || rawStatus === "success") {
        clearCart();
      }

      setLoading(false);
    }

    loadPayment();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isSuccess = status === "successful" || status === "success";
  const paymentType = payment?.type || "";
  const amount = payment?.amount || 0;
  const currency = payment?.currency || "RWF";
  const paidAmount = formatCurrency(amount, currency);
  const reference = payment?.reference || txRef;

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
            You paid <strong>{paidAmount}</strong> for {payment?.competitionTitle || "competition"}. Your nomination is being processed and you will receive access to the participant dashboard shortly.
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
        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue" />
            <p className="text-muted">Confirming your payment...</p>
          </>
        ) : isSuccess ? (
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
