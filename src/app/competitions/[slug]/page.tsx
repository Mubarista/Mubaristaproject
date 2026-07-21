"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Globe,
  Trophy,
  Users,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/shared/countdown";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Competition } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function CompetitionDetailPage({ params }: Props) {
  const [slug, setSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState<Competition | null>(null);

  useEffect(() => {
    async function fetchSlug() {
      const resolvedParams = await params;
      setSlug(decodeURIComponent(resolvedParams.slug));
    }
    fetchSlug();
  }, [params]);

  async function fetchCompetition() {
    if (!slug) return;
    try {
      const res = await fetch(`/api/competitions?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setCompetition(data);
      } else {
        setCompetition(null);
      }
    } catch (error) {
      console.error("Error fetching competition:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!slug) return;
    fetchCompetition();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const channel = supabase
      .channel(`competition-detail-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competitions",
          filter: `slug=eq.${slug}`,
        },
        () => fetchCompetition()
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Competition detail realtime channel error:", status);
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!competition) notFound();

  return (
    <div className="pt-24 pb-16">
      <div className="relative h-[40vh] min-h-[300px]">
        {competition.banner ? (
          <Image src={competition.banner} alt={competition.title} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-muted-bg flex items-center justify-center">
            <span className="text-muted">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <Badge variant="yellow" className="mb-3">
                {competition.difficulty}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{competition.title}</h1>
              <p className="text-muted max-w-2xl">{competition.description}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg p-1 self-start md:self-auto">
              <span className="text-[10px] text-white/80 uppercase tracking-wide leading-none">End-In:</span>
              <Countdown deadline={competition.registrationDeadline} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardTitle className="mb-4">Competition Details</CardTitle>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: Trophy, label: "Prize Pool", value: formatCurrency(competition.prizePool || 0), color: "text-yellow" },
                  { icon: Users, label: "Available Slots", value: `${competition.availableSlots || 0}/${competition.totalSlots || 0}`, color: "text-blue" },
                  { icon: Calendar, label: "Registration Deadline", value: competition.registrationDeadline ? new Date(competition.registrationDeadline).toLocaleDateString() : "TBD", color: "text-red" },
                  { icon: Globe, label: "Countries", value: (competition.countriesAllowed || []).join(", "), color: "text-green" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-muted-bg/50">
                    <item.icon className={`h-5 w-5 mb-2 ${item.color}`} />
                    <p className="text-xs text-muted mb-1">{item.label}</p>
                    <p className="font-semibold text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-4">Rules</CardTitle>
              <ul className="space-y-2">
                {(competition.rules || []).map((rule: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green shrink-0 mt-0.5" />
                    {rule}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardTitle className="mb-4">Judging Criteria</CardTitle>
              <div className="flex flex-wrap gap-2">
                {(competition.judgingCriteria || []).map((c: string) => (
                  <Badge key={c} variant="blue">
                    {c}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-4">Event Timeline</CardTitle>
              <div className="space-y-4">
                {(competition.eventTimeline || []).map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-blue" />
                      {i < (competition.eventTimeline || []).length - 1 && (
                        <div className="w-px h-full bg-blue/30 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">{event.event}</p>
                      <p className="text-sm text-muted">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <p className="text-sm text-muted mb-1">Entry Fee</p>
              <p className="text-3xl font-bold text-green mb-4">
                {formatCurrency(competition.entryFee || 0)}
              </p>
              <p className="text-sm text-muted mb-1">Slots Remaining</p>
              <p className="text-xl font-bold text-blue mb-4">
                {competition.availableSlots || 0} / {competition.totalSlots || 0}
              </p>
              <p className="text-sm text-muted mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(competition.requiredSkills || []).map((s: string) => (
                  <Badge key={s} variant="default">
                    {s}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted mb-6">
                Organizer: {competition.organizer}
              </p>
              {competition.status === "judging" && (
                <Badge variant="yellow" className="mb-4">
                  Judging
                </Badge>
              )}
              {competition.status === "completed" || competition.status === "judging" ? (
                <>
                  <Button variant="secondary" className="w-full" size="lg" disabled>
                    Applications Closed
                  </Button>
                  <p className="text-xs text-muted text-center mt-3">
                    {competition.status === "judging"
                      ? "Judging is in progress"
                      : "This competition has already ended"}
                  </p>
                </>
              ) : competition.availableSlots <= 0 ? (
                <>
                  <Button variant="secondary" className="w-full" size="lg" disabled>
                    No slots remaining
                  </Button>
                  <p className="text-xs text-muted text-center mt-3">
                    All slots have been filled
                  </p>
                </>
              ) : (
                <>
                  <Link href={`/competitions/${slug}/apply`}>
                    <Button variant="premium" className="w-full" size="lg">
                      Apply Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <p className="text-xs text-muted text-center mt-3">
                    Apply first, then pay entry fee after nomination
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
