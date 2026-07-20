"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PremiumGate } from "@/components/shared/premium-gate";
import { LoadingDots } from "@/components/ui/loading-dots";

interface LearnCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  free: boolean;
  active: boolean;
  order: number;
}

export default function LearnPage() {
  const { user, isPremium } = useAuth();
  const [learnCategories, setLearnCategories] = useState<LearnCategory[]>([]);
  const [learnSettings, setLearnSettings] = useState({
    badgeText: "Education",
    title: "Learning Center",
    description: "Free educational content for baristas at every level. Upgrade for premium courses and certifications.",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [settingsRes, categoriesRes] = await Promise.all([
        fetch("/api/site-settings"),
        fetch("/api/learn-categories"),
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setLearnSettings({
          badgeText: data.learnBadgeText || "Education",
          title: data.learnTitle || "Learning Center",
          description: data.learnDescription || "Free educational content for baristas at every level. Upgrade for premium courses and certifications.",
        });
      }
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setLearnCategories(data.filter((c: LearnCategory) => c.active));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const freeCategories = learnCategories.filter((c) => c.free);
  const premiumCategories = learnCategories.filter((c) => !c.free);

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="flex items-center justify-center py-12">
          <LoadingDots />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Education"
            title="Learning Center"
            description="Log in or register to access the learning center."
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-12">
            <Link href="/login">
              <Button variant="secondary">Log In</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Register</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={learnSettings.badgeText}
          title={learnSettings.title}
          description={learnSettings.description}
        />

        <h3 className="text-2xl font-semibold mb-6">Free Content</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {freeCategories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/learn/${cat.id}`}>
                <Card className="h-full cursor-pointer group">
                  <span className="text-3xl mb-3 block">{cat.icon}</span>
                  <CardTitle className="group-hover:text-blue transition-colors">
                    {cat.title}
                  </CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                  <Badge variant="green" className="mt-4">
                    Free
                  </Badge>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5 text-yellow" />
          Premium Learning
        </h3>
        <PremiumGate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {premiumCategories.map((cat) => (
              <Card key={cat.id} className="h-full">
                <span className="text-3xl mb-3 block">{cat.icon}</span>
                <CardTitle>{cat.title}</CardTitle>
                <CardDescription>{cat.description}</CardDescription>
                <Badge variant="premium" className="mt-4">
                  Premium
                </Badge>
              </Card>
            ))}
          </div>
        </PremiumGate>

        {!isPremium && (
          <div className="mt-12 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 text-blue font-medium hover:underline">
              Register & Upgrade to Access Premium Content
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
