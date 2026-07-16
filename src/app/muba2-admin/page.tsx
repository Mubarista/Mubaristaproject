"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy, Medal, Image, Star, Building2, Coffee, Lightbulb,
  FileText, HelpCircle, BookOpen, Wrench, Briefcase,
  GraduationCap, Clock, UserCheck, Home, Globe,
  DollarSign, Scale, MessageSquare, RefreshCw,
} from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRealtimeAdmin } from "@/lib/use-realtime-admin";

const sections = [
  { label: "Hero & Stats", href: "/muba2-admin/hero", icon: Home, color: "text-blue", bg: "bg-blue/10", api: null },
  { label: "Competitions", href: "/muba2-admin/competitions", icon: Trophy, color: "text-yellow", bg: "bg-yellow/10", api: "/api/competitions" },
  { label: "Winners", href: "/muba2-admin/winners", icon: Medal, color: "text-yellow", bg: "bg-yellow/10", api: "/api/winners" },
  { label: "Latte Art", href: "/muba2-admin/latte-art", icon: Image, color: "text-blue", bg: "bg-blue/10", api: "/api/latte-art" },
  { label: "Testimonials", href: "/muba2-admin/testimonials", icon: Star, color: "text-green", bg: "bg-green/10", api: "/api/testimonials" },
  { label: "Sponsors", href: "/muba2-admin/sponsors", icon: Building2, color: "text-muted", bg: "bg-muted-bg", api: "/api/sponsors" },
  { label: "Coffee Facts", href: "/muba2-admin/coffee-facts", icon: Coffee, color: "text-yellow", bg: "bg-yellow/10", api: "/api/coffee-facts" },
  { label: "Tips & Skills", href: "/muba2-admin/tips", icon: Lightbulb, color: "text-yellow", bg: "bg-yellow/10", api: "/api/tips" },
  { label: "Articles", href: "/muba2-admin/articles", icon: FileText, color: "text-blue", bg: "bg-blue/10", api: "/api/articles" },
  { label: "FAQs", href: "/muba2-admin/faqs", icon: HelpCircle, color: "text-green", bg: "bg-green/10", api: "/api/faqs" },
  { label: "Learn Categories", href: "/muba2-admin/learn", icon: BookOpen, color: "text-blue", bg: "bg-blue/10", api: "/api/learn-categories" },
  { label: "Books", href: "/muba2-admin/books", icon: BookOpen, color: "text-yellow", bg: "bg-yellow/10", api: "/api/books" },
  { label: "Tools", href: "/muba2-admin/tools", icon: Wrench, color: "text-red", bg: "bg-red/10", api: "/api/tools" },
  { label: "Jobs", href: "/muba2-admin/jobs", icon: Briefcase, color: "text-green", bg: "bg-green/10", api: "/api/jobs" },
  { label: "Schools", href: "/muba2-admin/schools", icon: GraduationCap, color: "text-blue", bg: "bg-blue/10", api: "/api/schools" },
  { label: "Coffee Timeline", href: "/muba2-admin/timeline", icon: Clock, color: "text-yellow", bg: "bg-yellow/10", api: "/api/timeline" },
  { label: "Legends", href: "/muba2-admin/legends", icon: UserCheck, color: "text-blue", bg: "bg-blue/10", api: "/api/legends" },
  { label: "About", href: "/muba2-admin/about", icon: FileText, color: "text-blue", bg: "bg-blue/10", api: null },
  { label: "Contact", href: "/muba2-admin/contact", icon: Building2, color: "text-green", bg: "bg-green/10", api: null },
  { label: "Message Center", href: "/muba2-admin/messages", icon: MessageSquare, color: "text-blue", bg: "bg-blue/10", api: "/api/contact" },
  { label: "Countries", href: "/muba2-admin/countries", icon: Globe, color: "text-green", bg: "bg-green/10", api: null },
  { label: "Payments", href: "/muba2-admin/payments", icon: DollarSign, color: "text-green", bg: "bg-green/10", api: "/api/payments" },
  { label: "Judges", href: "/muba2-admin/judges", icon: Scale, color: "text-blue", bg: "bg-blue/10", api: "/api/judges" },
];

export default function AdminPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch platform stats
      const statsRes = await fetch("/api/platform-stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setPlatformStats(statsData);
      }

      // Fetch counts for each section
      const countPromises = sections
        .filter(s => s.api)
        .map(async (s) => {
          try {
            const res = await fetch(s.api!);
            if (res.ok) {
              const data = await res.json();
              return { label: s.label, count: Array.isArray(data) ? data.length : 0 };
            }
          } catch (error) {
            console.error(`Error fetching ${s.label}:`, error);
          }
          return { label: s.label, count: 0 };
        });

      const countResults = await Promise.all(countPromises);
      const countsMap: Record<string, number> = {};
      countResults.forEach(r => {
        countsMap[r.label] = r.count;
      });
      countsMap["Hero & Stats"] = 1;
      setCounts(countsMap);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    // Polling fallback every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Real-time updates from Supabase
  useRealtimeAdmin(fetchAllData);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <LoadingDots />
        <p className="text-sm text-muted animate-pulse">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Admin Portal</h1>
          <p className="text-muted">Full CMS control with real-time data updates.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={fetchAllData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-700 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Platform stats summary - auto-calculated from database */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {platformStats ? [
          { label: "Live Competitions", value: platformStats.liveCompetitions || 0, color: "text-yellow" },
          { label: "Total Participants", value: (platformStats.totalParticipants || 0).toLocaleString(), color: "text-blue" },
          { label: "Countries", value: platformStats.countriesJoined || 0, color: "text-green" },
          { label: "Total Winners", value: (platformStats.totalWinners || 0).toLocaleString(), color: "text-red" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className={`text-center transition-all duration-300 ${refreshing ? "opacity-60 scale-[0.98]" : "opacity-100 scale-100"}`}>
              <p className={`text-2xl font-bold mb-0.5 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </Card>
          </motion.div>
        )) : null}
      </div>

      <h2 className="text-lg font-semibold mb-4">Content Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sections.map((s, i) => (
          <motion.div
            key={s.href}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.02 }}
          >
            <Link href={s.href}>
              <Card className={`cursor-pointer group hover:border-blue/30 transition-all duration-300 ${refreshing ? "opacity-60" : "opacity-100"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <span className="text-2xl font-bold text-muted/50">
                    {counts[s.label] ?? "—"}
                  </span>
                </div>
                <p className="font-semibold text-sm group-hover:text-blue transition-colors">{s.label}</p>
                <p className="text-xs text-muted mt-0.5">{counts[s.label] ?? 0} item{(counts[s.label] ?? 0) !== 1 ? "s" : ""}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
