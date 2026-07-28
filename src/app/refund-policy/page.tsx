"use client";

import { useState, useEffect } from "react";
import { SectionHeading } from "@/components/shared/section-heading";
import { LoadingDots } from "@/components/ui/loading-dots";

interface SiteSettings {
  refundContent?: string;
  updatedAt?: string;
}

const defaultRefundPolicy = `At MUBARISTA, we want you to be satisfied with every purchase and experience on our platform. This Refund Policy explains when and how you can request a refund.

1. Eligibility for Refunds

Refunds may be issued for the following:
- Duplicate charges or billing errors
- Competition entry fees when the competition is cancelled by MUBARISTA
- Digital products that were not delivered as described and cannot be corrected
- Services that were paid for but not rendered

Refunds are not guaranteed and are reviewed on a case-by-case basis.

2. Non-Refundable Items

The following are generally not eligible for refunds:
- Completed digital downloads once access has been granted
- Membership or subscription fees after the billing period has started
- Competition entry fees when the competition has already started or completed
- Services that have already been delivered or used

3. Refund Request Process

To request a refund, contact our support team within 14 days of the transaction. Provide your order or transaction reference, the reason for the refund, and any supporting information.

4. Refund Timeline

Approved refunds are processed to the original payment method within 7–14 business days. Processing times may vary depending on the payment provider.

5. Disputes and Chargebacks

We encourage you to contact us before initiating a chargeback. Unresolved disputes may result in account suspension until the matter is settled.

6. Changes to This Policy

We may update this Refund Policy at any time. Continued use of MUBARISTA after changes means you accept the updated policy.

If you have questions, please contact us through the Contact page.`;

export default function RefundPolicyPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching refund policy:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  const content = settings?.refundContent || defaultRefundPolicy;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Legal"
          title="Refund Policy"
          description="Our guidelines for refunds and returns on MUBARISTA."
        />
        <div className="glass-card rounded-2xl p-6 md:p-10 mt-8">
          <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
