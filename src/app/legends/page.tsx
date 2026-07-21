"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";

export default function LegendsPage() {
  const [legends, setLegends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLegends();
  }, []);

  async function fetchLegends() {
    try {
      const response = await fetch("/api/legends");
      if (response.ok) {
        const data = await response.json();
        setLegends(data);
      }
    } catch (error) {
      console.error("Error fetching legends:", error);
    } finally {
      setLoading(false);
    }
  }
  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Icons"
            title="Legend Baristas"
            description="Celebrating the pioneers and champions who shaped modern latte art."
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
          eyebrow="Icons"
          title="Legend Baristas"
          description="Celebrating the pioneers and champions who shaped modern latte art."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {legends.map((legend, i) => (
            <motion.div
              key={legend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/legends/${legend.id}`}>
                <div className="group glass-card rounded-2xl overflow-hidden cursor-pointer">
                  <div className="relative h-64 overflow-hidden bg-muted-bg">
                    {legend.image ? (
                      <Image
                        src={legend.image}
                        alt={legend.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-xl font-bold text-white">{legend.name}</h3>
                      <p className="text-white/70 text-sm">{legend.country}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-muted line-clamp-2 mb-3">{legend.biography}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {legend.awards.split(',').slice(0, 2).map((a: string, idx: number) => (
                        <Badge key={idx} variant="yellow">
                          <Trophy className="h-3 w-3 mr-1" />
                          {a.trim()}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-blue text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Profile <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
