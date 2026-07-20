"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Star, ExternalLink, Mail } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function SchoolsPage() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  }
  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Education"
            title="Barista Schools"
            description="Global coffee schools offering certifications and professional programs. Free for all visitors."
          />
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
            eyebrow="Education"
            title="Barista Schools"
            description="Log in or register to view barista schools."
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
          eyebrow="Education"
          title="Barista Schools"
          description="Global coffee schools offering certifications and professional programs. Free for all visitors."
        />

        <div className="space-y-8">
          {schools.map((school, i) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{school.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow text-yellow" />
                        <span className="text-sm font-medium">{school.rating}</span>
                        <span className="text-sm text-muted">({school.reviews})</span>
                      </div>
                    </div>
                    <p className="flex items-center gap-2 text-muted text-sm mb-4">
                      <MapPin className="h-4 w-4 text-green" /> {school.location}
                    </p>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {school.certifications && school.certifications.split(',').map((c: string, idx: number) => (
                          <Badge key={idx} variant="green">{c.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Programs</p>
                      <div className="flex flex-wrap gap-2">
                        {school.programs && school.programs.split(',').map((p: string, idx: number) => (
                          <Badge key={idx} variant="blue">{p.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="primary">
                      <Mail className="h-4 w-4" /> {school.contact}
                    </Button>
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4" /> {school.website}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
