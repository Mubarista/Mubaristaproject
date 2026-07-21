"use client";

import { useState, useEffect } from "react";
import { SectionHeading } from "@/components/shared/section-heading";
import { LoadingDots } from "@/components/ui/loading-dots";

interface SiteSettings {
  termsContent?: string;
  updatedAt?: string;
}

const defaultTerms = `Welcome to MUBARISTA. These Terms of Service govern your use of our website and services.

1. Acceptance of Terms
By accessing or using MUBARISTA, you agree to be bound by these Terms.

2. User Accounts
You are responsible for maintaining the confidentiality of your account information.

3. Competitions
All competitions are subject to their specific rules. Judges' decisions are final.

4. Content
You retain ownership of content you upload. You grant MUBARISTA a license to display it in connection with the services.

5. Payments
Entry fees are non-refundable unless otherwise stated. Prizes are awarded according to competition rules.

6. Prohibited Conduct
Do not use MUBARISTA for unlawful purposes or to harass others.

7. Changes
We may update these Terms at any time. Continued use after changes means you accept the new Terms.

If you have questions, please contact us through the Contact page.`;

export default function TermsPage() {
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
      console.error("Error fetching terms:", error);
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

  const content = settings?.termsContent || defaultTerms;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Legal"
          title="Terms of Service"
          description="The rules and guidelines for using MUBARISTA."
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
