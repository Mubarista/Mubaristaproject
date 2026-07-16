"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MtnMomoIcon } from "@/components/icons/mtn-momo";
import { VisaIcon } from "@/components/icons/visa";
import { MastercardIcon } from "@/components/icons/mastercard";
import type { CompetitionApplication } from "@/types";

export default function AccessPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [expired, setExpired] = useState(false);
  const [application, setApplication] = useState<CompetitionApplication | null>(null);

  async function validateAccessLink() {
    try {
      const response = await fetch(`/api/access/validate?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setValid(true);
        setApplication(data);
      } else {
        const error = await response.json();
        if (error.error === "expired") {
          setExpired(true);
        }
        setValid(false);
      }
    } catch (error) {
      console.error("Validation error:", error);
      setValid(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    validateAccessLink();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Validating access link...</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="h-16 w-16 text-red mx-auto mb-4" />
          <CardTitle className="mb-2">Invalid or Expired Link</CardTitle>
          <p className="text-muted mb-6">
            {expired
              ? "This access link has expired. Please contact support for assistance."
              : "This access link is invalid. Please check your email for the correct link."}
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
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10 border border-green/30">
            <Lock className="h-8 w-8 text-green" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Access Granted</h1>
          <p className="text-muted">
            You have been nominated for {application?.competition?.title}
          </p>
          <Badge variant="green" className="mt-2">
            Application Approved
          </Badge>
        </div>

        <Card>
          <CardTitle className="mb-4">
            {application?.paymentStatus === "paid"
              ? "Payment Completed"
              : "Complete Payment to Join Competition"}
          </CardTitle>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 rounded-xl bg-muted-bg">
              <span className="text-muted">Entry Fee</span>
              <span className="text-2xl font-bold text-green">
                ${application?.competition?.entryFee}
              </span>
            </div>
            {application?.paymentStatus !== "paid" && (
              <p className="text-sm text-muted">
                You have <strong className="text-red">3 days</strong> to complete payment before this access link expires.
              </p>
            )}
            {application?.paymentStatus === "paid" && (
              <p className="text-sm text-green">
                Your payment is confirmed. This access link remains valid until{" "}
                {application?.accessLinkExpiresAt
                  ? new Date(application.accessLinkExpiresAt).toLocaleString()
                  : "it expires"}
                .
              </p>
            )}
          </div>

          {application?.paymentStatus !== "paid" && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Payment Methods</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "MoMo Rwanda", icon: <MtnMomoIcon className="h-8 w-12 mx-auto" /> },
                  { name: "Visa", icon: <VisaIcon className="h-8 w-12 mx-auto" /> },
                  { name: "Mastercard", icon: <MastercardIcon className="h-8 w-12 mx-auto" /> },
                ].map((method) => (
                  <button
                    key={method.name}
                    className="p-4 rounded-xl border border-white/10 hover:border-blue hover:bg-blue/5 transition-all text-sm font-medium flex flex-col items-center justify-center gap-2"
                  >
                    {method.icon}
                    {method.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {application?.paymentStatus === "paid" ? (
            <Button
              variant="premium"
              className="w-full"
              size="lg"
              onClick={() => router.push(`/dashboard/participant?token=${application?.accessLink}`)}
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="premium"
              className="w-full"
              size="lg"
              onClick={() => router.push(`/payment/${application?.id}`)}
            >
              Proceed to Payment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
