"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { SectionHeading } from "@/components/shared/section-heading";
import { LoadingDots } from "@/components/ui/loading-dots";

interface CoffeeHistory {
  id: string;
  year: string;
  title: string;
  description: string;
  image: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CoffeeHistoryPage() {
  const [timeline, setTimeline] = useState<CoffeeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  async function fetchTimeline() {
    setLoading(true);
    try {
      const res = await fetch("/api/coffee-history");
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch (error) {
      console.error("Error fetching coffee history:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="flex items-center justify-center py-12">
          <LoadingDots />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Heritage"
          title="Coffee History"
          description="An interactive journey through the origins and evolution of coffee culture."
        />

        <div className="relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue via-green to-yellow md:-translate-x-px" />

          {timeline.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex items-center gap-8 mb-16 ${
                i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              <div className="hidden md:block flex-1" />
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
                <div className="h-4 w-4 rounded-full bg-blue ring-4 ring-background animate-pulse-glow" />
              </div>
              <div className="flex-1 ml-16 md:ml-0">
                <div className="glass-card rounded-2xl overflow-hidden">
                  {event.image ? (
                    <div className="relative h-40">
                      <Image src={event.image} alt={event.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <span className="text-sm font-bold text-blue">{event.year}</span>
                    <h3 className="text-xl font-semibold mt-1 mb-2">{event.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{event.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
