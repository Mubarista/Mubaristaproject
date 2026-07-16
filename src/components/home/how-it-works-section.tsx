"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  UserPlus,
  Search,
  Upload,
  Trophy,
  Crown,
  Star,
  BookOpen,
  Coffee,
  Heart,
  Globe,
  Award,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-context";

interface HowItWorksStep {
  id: string;
  number: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  bg: string;
  sortOrder: number;
  isActive: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  Search,
  Upload,
  Trophy,
  Crown,
  Star,
  BookOpen,
  Coffee,
  Heart,
  Globe,
  Award,
  Zap,
};

const defaultSteps: HowItWorksStep[] = [
  {
    id: "default-1",
    iconName: "UserPlus",
    number: "01",
    title: "Create Your Account",
    description:
      "Sign up for free in seconds. Complete your barista profile with your experience level, country, and specialties.",
    color: "text-blue",
    bg: "bg-blue/10 border-blue/20",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "default-2",
    iconName: "Search",
    number: "02",
    title: "Browse Competitions",
    description:
      "Explore competitions by difficulty, prize pool, and deadline. Read the full rules and judging criteria before applying.",
    color: "text-green",
    bg: "bg-green/10 border-green/20",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "default-3",
    iconName: "Upload",
    number: "03",
    title: "Submit Your Art",
    description:
      "Apply, complete payment, and upload your latte art video or photos. Our judges review submissions from around the world.",
    color: "text-yellow",
    bg: "bg-yellow/10 border-yellow/20",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "default-4",
    iconName: "Trophy",
    number: "04",
    title: "Win & Get Recognized",
    description:
      "Winners receive cash prizes, certificates, and global recognition. Your work is showcased in our Hall of Fame.",
    color: "text-red",
    bg: "bg-red/10 border-red/20",
    sortOrder: 4,
    isActive: true,
  },
];

export function HowItWorksSection() {
  const [steps, setSteps] = useState<HowItWorksStep[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    async function fetchSteps() {
      try {
        const res = await fetch("/api/how-it-works");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSteps(data);
          } else {
            setSteps(defaultSteps);
          }
        } else {
          setSteps(defaultSteps);
        }
      } catch (error) {
        console.error("Error fetching how it works steps:", error);
        setSteps(defaultSteps);
      } finally {
        setLoading(false);
      }
    }

    fetchSteps();
  }, []);

  if (loading) {
    return (
      <section className="section-padding">
        <div className="mx-auto max-w-7xl flex items-center justify-center py-12">
          <LoadingDots />
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold uppercase tracking-widest text-blue mb-3">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            From Barista to Champion
          </h2>
          <p className="text-muted max-w-2xl mx-auto">
            Four simple steps to start your global competition journey on MUBARISTA.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, i) => {
            const Icon = iconMap[step.iconName] || UserPlus;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-10 left-[calc(100%+0px)] h-px bg-gradient-to-r from-white/10 to-transparent z-0 pointer-events-none"
                    style={{ width: "calc(100% - 80px)", left: "calc(100% - 0px)" }}
                  />
                )}
                <div className="glass-card rounded-2xl p-6 h-full relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${step.bg}`}
                    >
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <span className="text-4xl font-bold text-foreground/10 font-display">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {!(user && !isAuthLoading) && (
            <Link href="/register">
              <Button variant="primary" size="xl">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
