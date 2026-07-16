"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, FileText, Server, Eye, Trash2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrivacyContent() {
      try {
        const res = await fetch("/api/site-settings");
        if (res.ok) {
          const data = await res.json();
          setContent(data?.privacyContent || null);
        }
      } catch (error) {
        console.error("Error fetching privacy content:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrivacyContent();
  }, []);

  const defaultContent = `At MUBARISTA, we are committed to protecting your personal information and respecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your data when you use our platform.

1. Information We Collect

We collect information that you provide directly to us when you register an account or create a profile, apply to competitions, make purchases or payments, contact our support team, or participate in surveys or promotions.

This may include your name, email address, phone number, country, date of birth, gender, profile photo, video submissions, payment information, and competition-related data.

2. How We Use Your Information

We use your information to process your competition applications and payments, verify your eligibility and identity, communicate with you about competitions, results, and platform updates, provide customer support, improve our platform, and comply with legal obligations.

3. Data Storage and Security

Your data is stored in a secure environment with industry-standard protections. We use encryption, access controls, and secure server infrastructure to safeguard your information. We partner with trusted service providers who maintain high security standards.

We do not sell your personal information to third parties. Access to your data is restricted to authorized personnel who need it to perform their duties.

4. Your Rights

You have the right to access the personal information we hold about you, request correction of inaccurate data, request deletion of your account and data, and opt out of marketing communications.

5. Data Retention

We retain your data only for as long as necessary to provide our services and fulfill the purposes described in this policy. After a competition ends, participant accounts may be closed according to the terms and conditions.

6. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated date.

If you have any questions about this Privacy Policy or how your data is handled, please contact our support team.`;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl bg-blue/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-muted max-w-2xl mx-auto">
            Learn how MUBARISTA collects, protects, and stores your personal information in a secure environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Lock, title: "Secure Storage", desc: "Your data is encrypted and stored in secure, access-controlled environments." },
            { icon: Eye, title: "Transparent Use", desc: "We clearly explain what data we collect and how we use it to serve you." },
            { icon: Server, title: "Protected Servers", desc: "Industry-standard infrastructure safeguards your information 24/7." },
          ].map((item, i) => (
            <Card key={i} className="p-5 text-center">
              <div className="h-10 w-10 rounded-xl bg-blue/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-5 w-5 text-blue" />
              </div>
              <CardTitle className="text-base mb-2">{item.title}</CardTitle>
              <p className="text-sm text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-5 w-5 text-blue" />
            <CardTitle className="text-xl">Privacy Policy Details</CardTitle>
          </div>
          {loading ? (
            <div className="py-8 text-center text-muted">Loading privacy policy...</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-muted leading-relaxed">
              {content || defaultContent}
            </div>
          )}
        </Card>

        <div className="mt-12 p-6 rounded-2xl bg-blue/5 border border-blue/10">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-blue shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Data Control</h3>
              <p className="text-sm text-muted">
                You can request access to, correction of, or deletion of your personal data at any time by contacting our support team. We respect your right to control your information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
