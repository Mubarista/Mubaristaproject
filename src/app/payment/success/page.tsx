"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<string>("");
  const [reference, setReference] = useState<string | null>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rawStatus = params.get("status") || "successful";
    const rawReference = params.get("reference");
    setStatus(rawStatus);
    setReference(rawReference);

    if (rawStatus === "successful" || rawStatus === "success") {
      clearCart();
    }
  }, [clearCart]);

  const isSuccess = status === "successful" || status === "success";

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Thank you!</h1>
            <p className="text-muted mb-6">
              Your payment has been received and is being processed.
              {reference && (
                <span className="block mt-2">
                  Reference: <strong>{reference}</strong>
                </span>
              )}
            </p>
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
