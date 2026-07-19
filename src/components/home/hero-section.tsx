"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Trophy, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { formatNumber } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface HeroContent {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaPrimary: string;
  ctaSecondary: string;
  createdAt: string;
  updatedAt: string;
}

interface HeroBackground {
  id: string;
  type: string;
  imageUrl: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface PlatformStats {
  id: string;
  liveCompetitions: number;
  totalParticipants: number;
  countriesJoined: number;
  totalWinners: number;
  createdAt: string;
  updatedAt: string;
}

export function HeroSection() {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [heroBackground, setHeroBackground] = useState<HeroBackground | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    fetchHeroData();

    // Poll for latest stats so the hero section stays in sync with admin data
    const interval = setInterval(fetchHeroData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHeroData() {
    try {
      const response = await fetch("/api/hero");
      if (response.ok) {
        const data = await response.json();
        setPlatformStats(data.platformStats);
        setHeroContent(data.heroContent);
        // Don't overwrite the background with null because of transient API errors;
        // only update when the API actually returns a value.
        setHeroBackground((prev) => data.heroBackground || prev);
      }
    } catch (error) {
      console.error("Error fetching hero data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Check if there are active/live competitions
  const hasLiveCompetitions = (platformStats?.liveCompetitions ?? 0) > 0;

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <LoadingDots />
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background — video or image */}
      {heroBackground?.videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={heroBackground.videoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : heroBackground?.imageUrl && !imageError ? (
        <img
          src={heroBackground.imageUrl}
          alt=""
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-black/80" />
      )}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 bg-black/55 dark:bg-black/65" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {hasLiveCompetitions && heroContent?.badge && (
              <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm mb-6 text-white">
                <span className="h-2 w-2 rounded-full bg-green animate-pulse" />
                {heroContent.badge}
              </span>
            )}

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-white">
              {heroContent?.title}
            </h1>

            <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-10 leading-relaxed">
              {heroContent?.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              {user && !isAuthLoading ? (
                <Link href="/dashboard">
                  <Button variant="primary" size="xl" className="w-full sm:w-auto">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button variant="primary" size="xl" className="w-full sm:w-auto">
                    {heroContent?.ctaPrimary}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link href="/competitions">
                <Button variant="secondary" size="xl" className="w-full sm:w-auto !bg-black/50 !text-white hover:!bg-white/10">
                  <Trophy className="h-5 w-5 text-yellow" />
                  {heroContent?.ctaSecondary}
                </Button>
              </Link>
              <Link href="/learn">
                <Button variant="outline" size="xl" className="w-full sm:w-auto border-white/30 text-white hover:bg-white hover:text-black">
                  <Play className="h-5 w-5" />
                  Learn Barista Skills
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {platformStats && [
              ...(platformStats.liveCompetitions > 0 ? [{
                icon: Trophy,
                value: platformStats.liveCompetitions,
                label: "Live Competitions",
                color: "text-yellow",
              }] : []),
              {
                icon: Users,
                value: platformStats.totalParticipants,
                label: "Total Participants",
                color: "text-blue",
              },
              {
                icon: Globe,
                value: platformStats.countriesJoined,
                label: "Countries Joined",
                color: "text-green",
              },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl p-6 text-center text-white bg-black/50 border border-white/10 backdrop-blur-2xl">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-3xl font-bold mb-1 text-white">
                  {formatNumber(stat.value)}
                  {stat.label === "Live Competitions" && "+"}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}
