"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MtnMomoIcon } from "@/components/icons/mtn-momo";
import { VisaIcon } from "@/components/icons/visa";
import { MastercardIcon } from "@/components/icons/mastercard";
import { formatCurrency } from "@/lib/utils";
import type { CompetitionApplication } from "@/types";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<CompetitionApplication | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  async function fetchApplication() {
    try {
      const response = await fetch(`/api/competitions/applications/${applicationId}`);
      if (response.ok) {
        const data = (await response.json()) as CompetitionApplication;
        setApplication(data);
      }
    } catch (error) {
      console.error("Error fetching application:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApplication();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function handlePayment() {
    if (!selectedMethod) return;

    setProcessing(true);
    setPaymentError(null);
    try {
      const response = await fetch(`/api/payment/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          method: selectedMethod,
          amount: application?.competition?.entryFee,
          currency: "RWF",
        }),
      });

      if (response.ok) {
        setPaymentSuccess(true);
        setTimeout(() => {
          const token = application?.accessLink;
          if (token) {
            router.push(`/dashboard/participant?token=${token}`);
          } else {
            router.push("/dashboard/participant");
          }
        }, 2000);
      } else {
        setPaymentError("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading payment details...</p>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <CheckCircle className="h-16 w-16 text-green mx-auto mb-4" />
          <CardTitle className="mb-2">Payment Successful!</CardTitle>
          <p className="text-muted mb-6">
            Your payment has been confirmed. Redirecting to your dashboard...
          </p>
          <Badge variant="green">Paid</Badge>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="h-16 w-16 text-red mx-auto mb-4" />
          <CardTitle className="mb-2">Application Not Found</CardTitle>
          <p className="text-muted mb-6">
            Could not find the application. Please contact support.
          </p>
          <Button variant="secondary" onClick={() => router.push("/competitions")}>
            Browse Competitions
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
        <p className="text-muted mb-8">
          Entry fee for {application?.competition?.title}
        </p>

        <Card>
          <CardTitle className="mb-4">Payment Details</CardTitle>
          {paymentError && (
            <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-red/10 border border-red/30">
              <AlertCircle className="h-5 w-5 text-red shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red mb-1">Payment Error</p>
                <p className="text-sm text-foreground/90">{paymentError}</p>
              </div>
            </div>
          )}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 rounded-xl bg-muted-bg">
              <span className="text-muted">Entry Fee</span>
              <span className="text-2xl font-bold text-green">
                {formatCurrency(application?.competition?.entryFee ?? 0, "RWF")}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-muted-bg">
              <span className="text-muted">Application Status</span>
              <Badge variant="green">Nominated</Badge>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Select Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Momo Pay", icon: <MtnMomoIcon className="h-8 w-12 mx-auto" /> },
                { name: "Visa", icon: <VisaIcon className="h-8 w-12 mx-auto" /> },
                { name: "Mastercard", icon: <MastercardIcon className="h-8 w-12 mx-auto" /> },
              ].map((method) => (
                <button
                  key={method.name}
                  onClick={() => setSelectedMethod(method.name)}
                  className={`p-4 rounded-xl border transition-all text-sm font-medium flex flex-col items-center justify-center gap-2 ${
                    selectedMethod === method.name
                      ? "border-blue bg-blue/10 text-blue"
                      : "border-white/10 hover:border-blue hover:bg-blue/5"
                  }`}
                >
                  {method.icon}
                  {method.name}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="premium"
            className="w-full"
            size="lg"
            disabled={!selectedMethod || processing}
            onClick={handlePayment}
          >
            {processing ? "Processing Payment..." : `Pay ${formatCurrency(application?.competition?.entryFee ?? 0, "RWF")}`}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <p className="text-xs text-muted text-center mt-4">
            Payment is secure and encrypted. Your payment information is never stored.
          </p>
        </Card>
      </div>
    </div>
  );
}
