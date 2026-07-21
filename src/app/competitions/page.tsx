"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Globe, Trophy, Users, ArrowRight } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SectionHeading } from "@/components/shared/section-heading";
import { Countdown } from "@/components/shared/countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Competition } from "@/types";

const difficultyColors: Record<string, "blue" | "green" | "yellow" | "red"> = {
  Beginner: "green",
  Intermediate: "blue",
  Professional: "yellow",
  Master: "red",
};

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("competitions-public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competitions" },
        () => fetchCompetitions()
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Competitions realtime channel error:", status);
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCompetitions() {
    try {
      const res = await fetch("/api/competitions");
      const data = await res.json();
      setCompetitions(data);
    } catch (error) {
      console.error("Error fetching competitions:", error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Compete Globally"
          title="Online Latte Art Competitions"
          description="Browse competitions, view prizes, read rules, and apply to compete with baristas worldwide."
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">No competitions available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {competitions.map((comp, i) => (
            <motion.div
              key={comp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card glass={false} className="overflow-hidden p-0 h-full flex flex-col bg-black/60 border-white/10 text-white">
                <div className="relative h-48">
                  {comp.banner ? (
                    <Image src={comp.banner} alt={comp.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                      <span className="text-muted">No image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
                  <Badge
                    variant={difficultyColors[comp.difficulty]}
                    className="absolute top-4 left-4"
                  >
                    {comp.difficulty}
                  </Badge>
                  <Badge
                    variant={
                      comp.status === "open"
                        ? "green"
                        : comp.status === "judging"
                        ? "yellow"
                        : "default"
                    }
                    className="absolute top-4 right-4"
                  >
                    {comp.status === "judging" ? "judging" : comp.status}
                  </Badge>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <Countdown deadline={comp.registrationDeadline} />
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold mb-2">{comp.title}</h3>
                  <p className="text-sm text-white/70 mb-4 flex-1">{comp.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow" />
                      <span>{formatCurrency(comp.prizePool)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue" />
                      <span>
                        {comp.availableSlots} slots left
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red" />
                      <span>{comp.registrationDeadline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green" />
                      <span>{comp.countriesAllowed[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="font-semibold text-green">
                      Entry: {formatCurrency(comp.entryFee)}
                    </span>
                    {comp.status === "judging" || comp.availableSlots <= 0 ? (
                      <Button variant="secondary" size="sm" disabled>
                        Full
                      </Button>
                    ) : (
                      <Link href={`/competitions/${encodeURIComponent(comp.slug)}`}>
                        <Button variant="primary" size="sm">
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
