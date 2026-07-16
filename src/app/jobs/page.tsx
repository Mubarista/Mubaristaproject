"use client";

import { useState, useEffect } from "react";
import { MapPin, Briefcase, Bookmark, DollarSign } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { SectionHeading } from "@/components/shared/section-heading";
import { PremiumGate } from "@/components/shared/premium-gate";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Careers"
            title="Barista Jobs"
            description="Worldwide opportunities for talented baristas. Premium membership required."
          />
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Careers"
          title="Barista Jobs"
          description="Worldwide opportunities for talented baristas. Premium membership required."
        />

        <PremiumGate>
          <div className="space-y-6">
            {jobs.map((job) => (
              <Card key={job.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <Badge variant="blue">{job.type}</Badge>
                  </div>
                  <p className="text-muted text-sm mb-3">{job.company}</p>
                  <p className="text-sm mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-green" /> {job.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-yellow" /> {job.salary}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-blue" /> {job.experience}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSaved((s) =>
                        s.includes(job.id) ? s.filter((id) => id !== job.id) : [...s, job.id]
                      )
                    }
                  >
                    <Bookmark className={`h-4 w-4 ${saved.includes(job.id) ? "fill-yellow text-yellow" : ""}`} />
                  </Button>
                  <Button variant="primary">Apply</Button>
                </div>
              </Card>
            ))}
          </div>
        </PremiumGate>
      </div>
    </div>
  );
}
