"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function CTASection() {
  const [ctaSettings, setCtaSettings] = useState({
    backgroundImage: "",
    badgeText: "Registrations now open for 2026 Season",
    title: "Ready to Compete With the World's Best Baristas?",
    description: "Join 48,500+ baristas from 127 countries. Enter competitions, win prizes, build your career, and become a global name in coffee.",
    primaryButtonText: "Join Free Today",
    secondaryButtonText: "View Live Competitions",
  });

  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  async function fetchSiteSettings() {
    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        const data = await res.json();
        setCtaSettings({
          backgroundImage: data.ctaBackgroundImage || "",
          badgeText: data.ctaBadgeText || "Registrations now open for 2026 Season",
          title: data.ctaTitle || "Ready to Compete With the World's Best Baristas?",
          description: data.ctaDescription || "Join 48,500+ baristas from 127 countries. Enter competitions, win prizes, build your career, and become a global name in coffee.",
          primaryButtonText: data.ctaPrimaryButtonText || "Join Free Today",
          secondaryButtonText: data.ctaSecondaryButtonText || "View Live Competitions",
        });
      }
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  }

  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #16a34a 50%, #c9a227 100%)",
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: ctaSettings.backgroundImage
                ? `url('${ctaSettings.backgroundImage}')`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <div className="relative z-10 px-8 py-16 md:py-24 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium mb-6">
                <Zap className="h-4 w-4 text-yellow-300" />
                {ctaSettings.badgeText}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-6 leading-tight">
                {ctaSettings.title}
              </h2>
              <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
                {ctaSettings.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!(user && !isAuthLoading) && (
                  <Link href="/register">
                    <Button
                      variant="secondary"
                      size="xl"
                      className="bg-white text-blue hover:bg-white/90 border-0"
                    >
                      {ctaSettings.primaryButtonText}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link href="/competitions">
                  <Button
                    variant="outline"
                    size="xl"
                    className="border-white/40 text-white hover:bg-white/10"
                  >
                    <Trophy className="h-5 w-5 text-yellow-300" />
                    {ctaSettings.secondaryButtonText}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
