"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Globe, BookOpen, Briefcase, GraduationCap, Coffee, ArrowRight } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { SectionHeading } from "@/components/shared/section-heading";
import { ExpandableText } from "@/components/shared/expandable-text";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

export default function AboutPage() {
  const [about, setAbout] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbout();
    fetchPlatformStats();
  }, []);

  async function fetchAbout() {
    try {
      const res = await fetch("/api/about");
      if (res.ok) {
        const data = await res.json();
        setAbout(data);
      }
    } catch (error) {
      console.error("Error fetching about content:", error);
    }
  }

  async function fetchPlatformStats() {
    try {
      const res = await fetch("/api/platform-stats");
      if (res.ok) {
        const data = await res.json();
        setPlatformStats(data);
      }
    } catch (error) {
      console.error("Error fetching platform stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  const values = about?.values ? (typeof about.values === 'string' ? JSON.parse(about.values) : about.values) : [];
  const features = about?.features ? (typeof about.features === 'string' ? JSON.parse(about.features) : about.features) : [];
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="About"
          title={about?.title}
          description="Building the world's leading platform for barista excellence."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <ExpandableText
              text={about?.description || ""}
              maxLength={300}
              className="text-muted leading-relaxed text-lg mb-6"
            />
            {about?.mission && (
              <p className="text-muted leading-relaxed text-lg mb-6">
                <strong>Mission:</strong> {about.mission}
              </p>
            )}
            {about?.vision && (
              <p className="text-muted leading-relaxed text-lg mb-6">
                <strong>Vision:</strong> {about.vision}
              </p>
            )}
            <Link href="/register">
              <Button variant="primary" size="lg">
                Join MUBARISTA
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="relative aspect-[210/297] rounded-2xl overflow-hidden group">
            {about?.imageUrl && (
              <Image
                src={about.imageUrl}
                alt="Barista crafting latte art"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue/30 to-transparent transition-opacity duration-300 group-hover:from-blue/50" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {platformStats ? [
            { label: "Participants", value: formatNumber(platformStats.totalParticipants), color: "text-blue" },
            { label: "Countries", value: String(platformStats.countriesJoined), color: "text-green" },
            { label: "Past Winners", value: formatNumber(platformStats.totalWinners), color: "text-yellow" },
            { label: "Live Events", value: String(platformStats.liveCompetitions), color: "text-red" },
          ].map((stat) => (
            <Card key={stat.label} className="text-center group">
              <p className={`text-3xl font-bold mb-1 transition-transform duration-300 group-hover:scale-110 ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </Card>
          )) : null}
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-10">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v: any, i: number) => {
              const Icon = v.icon === "Globe" ? Globe : 
                          v.icon === "Trophy" ? Trophy :
                          v.icon === "BookOpen" ? BookOpen :
                          v.icon === "Briefcase" ? Briefcase : Globe;
              return (
                <Card key={i} className="group">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${v.bg}`}>
                      <Icon className={`h-6 w-6 transition-transform duration-300 group-hover:rotate-3 ${v.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">{v.title}</CardTitle>
                      <p className="text-sm text-muted leading-relaxed">{v.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f: any, i: number) => {
              const Icon = f.icon === "Trophy" ? Trophy :
                          f.icon === "BookOpen" ? BookOpen :
                          f.icon === "Coffee" ? Coffee :
                          f.icon === "GraduationCap" ? GraduationCap :
                          f.icon === "Briefcase" ? Briefcase :
                          f.icon === "Globe" ? Globe : Trophy;
              const href =
                f.label === "Global Competitions" ? "/competitions" :
                f.label === "Learning Resources" ? "/learn" :
                f.label === "Community" ? "/contact" :
                f.label === "Career Growth" ? "/tips" :
                f.label === "Job Opportunities" ? "/jobs" :
                f.label === "International Network" ? "/schools" :
                undefined;
              const content = (
                <div className="group flex items-start gap-3 p-4 rounded-xl bg-muted-bg/40 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-muted-bg/70 hover:shadow-lg">
                  <Icon className="h-5 w-5 text-blue shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110" />
                  <div>
                    <p className="font-semibold text-sm transition-colors duration-300 group-hover:text-foreground">{f.label}</p>
                    <p className="text-xs text-muted">{f.desc}</p>
                  </div>
                </div>
              );
              return href ? (
                <Link key={i} href={href} className="block">
                  {content}
                </Link>
              ) : (
                <div key={i}>{content}</div>
              );
            })}
          </div>
        </div>

        <Card>
          <div className="flex flex-wrap gap-2 items-center">
            <CardTitle className="mr-4">Platform Roles</CardTitle>
            {about?.platformRoles?.map((role: string) => (
              <Badge key={role} variant="blue">{role}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted mt-3">
            {about?.platformRolesDescription || "MUBARISTA serves visitors, registered members, competition participants, administrators, and certified judges — each with tailored dashboards and access levels."}
          </p>
        </Card>
      </div>
    </div>
  );
}
