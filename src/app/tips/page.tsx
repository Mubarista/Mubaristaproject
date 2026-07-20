"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-context";

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  level: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const categories = ["All", "Latte Art", "Steaming", "Espresso", "Competition", "Maintenance", "Brewing"];
const levels = ["All Levels", "Beginner", "Intermediate", "Advanced", "Professional"];

const levelColor: Record<string, "green" | "blue" | "yellow" | "red"> = {
  Beginner: "green",
  Intermediate: "blue",
  Advanced: "yellow",
  Professional: "red",
};

export default function TipsPage() {
  const { user } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All Levels");

  useEffect(() => {
    fetchTips();
  }, []);

  async function fetchTips() {
    try {
      const res = await fetch("/api/tips?activeOnly=true");
      if (res.ok) {
        const data = await res.json();
        setTips(data);
      }
    } catch (error) {
      console.error("Error fetching tips:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () =>
      tips.filter(
        (t) =>
          (category === "All" || t.category === category) &&
          (level === "All Levels" || t.level === level) &&
          (t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.content.toLowerCase().includes(search.toLowerCase()))
      ),
    [search, category, level, tips]
  );

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Skills"
            title="Tips & Skills"
            description="Log in or register to view barista tips and skills."
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
          eyebrow="Skills"
          title="Tips & Skills"
          description="Daily barista wisdom from professionals around the world. Free for everyone."
        />

        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search tips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === cat ? "bg-blue text-white" : "bg-muted-bg hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  level === lvl ? "bg-green text-white" : "bg-muted-bg hover:bg-white/5"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted py-16">No tips match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tip, i) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="h-full">
                  <div className="flex gap-2 mb-3">
                    <Badge variant="blue">{tip.category}</Badge>
                    <Badge variant={levelColor[tip.level] ?? "default"}>{tip.level}</Badge>
                  </div>
                  <CardTitle className="text-lg mb-2">{tip.title}</CardTitle>
                  <p className="text-sm text-muted leading-relaxed">{tip.content}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-center text-muted text-sm mt-10">
          Showing {filtered.length} of {tips.length} tips
        </p>
      </div>
    </div>
  );
}
