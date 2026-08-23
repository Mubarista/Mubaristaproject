"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";

function WinnerCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden glass-card">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <SkeletonText lines={2} />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function WinnersSection() {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  async function fetchWinners() {
    try {
      const response = await fetch("/api/winners");
      if (response.ok) {
        const data = await response.json();
        setWinners(data);
      }
    } catch (error) {
      console.error("Error fetching winners:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="section-padding">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Hall of Fame"
            title="Winners Showcase"
            description="Celebrating the baristas who pushed the boundaries of latte art excellence."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <WinnerCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding pb-0 pt-0">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Hall of Fame"
          title="Winners Showcase"
          description="Celebrating the baristas who pushed the boundaries of latte art excellence."
        />

        {winners.length === 0 ? (
          <p className="text-center text-muted py-16">No winners yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {winners.map((winner, i) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group glass-card rounded-2xl overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  {winner.artImage ? (
                    <ImageWithSkeleton
                      src={winner.artImage}
                      alt={winner.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                      <span className="text-muted">No image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <Badge variant="yellow" className="absolute top-4 left-4">
                    <Trophy className="h-3 w-3 mr-1" />
                    Winner
                  </Badge>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-yellow">
                      {winner.image ? (
                        <ImageWithSkeleton src={winner.image} alt={winner.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                          <span className="text-muted text-xs">{winner.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{winner.name}</h3>
                      <p className="text-sm text-muted">{winner.country}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted mb-2">{winner.competition}</p>
                  <p className="text-xs text-muted mb-2">
                    {winner.winType === "today" ? "Winner of today" : 
                     winner.winType === "week" ? "Winner of the week" : 
                     winner.winType === "season" ? "Winner of the season" :
                     winner.winType === "month" ? "Winner of the month" :
                     winner.winType === "year" ? "Winner of the year" : "Winner"} - {new Date(winner.winDate).toLocaleDateString()}
                  </p>
                  <p className="text-lg font-bold text-green">
                    RWF {winner.prize}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/winners" className="text-blue hover:underline font-medium">
            View all past winners →
          </Link>
        </div>
      </div>
    </section>
  );
}
