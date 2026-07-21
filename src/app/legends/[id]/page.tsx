import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { ExpandableText } from "@/components/shared/expandable-text";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

interface Props {
  params: Promise<{ id: string }>;
}

function parseStringArray(value: any): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default async function LegendDetailPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("legends")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("[Legends] Error fetching legend:", error);
    notFound();
  }

  const legend = mapKeysToCamelCase(data) as any;
  const awards = parseStringArray(legend.awards);
  const achievements = parseStringArray(legend.achievements || legend.awards);
  const galleryImages = (legend.images || []).filter(Boolean);
  const displayImages = galleryImages.length ? galleryImages : [legend.image].filter(Boolean);

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/legends" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Legends
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ImageCarousel
              images={displayImages}
              alt={legend.name}
              aspectRatio={galleryImages.length ? "9/16" : "1/1"}
            />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{legend.name}</h1>
              <p className="text-muted">{legend.country}</p>
            </div>

            <Card>
              <CardTitle className="mb-3">Biography</CardTitle>
              <ExpandableText text={legend.biography} maxLength={300} className="text-muted leading-relaxed" />
            </Card>

            {achievements.length > 0 && (
              <Card>
                <CardTitle className="mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow" /> Achievements
                </CardTitle>
                <ul className="space-y-2">
                  {achievements.map((a: string) => (
                    <li key={a} className="flex items-start gap-2 text-sm">
                      <span className="text-green mt-1">✓</span> {a}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {awards.length > 0 && (
              <Card>
                <CardTitle className="mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue" /> Awards
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {awards.map((a: string) => (
                    <Badge key={a} variant="yellow">{a}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {legend.legacy && (
              <Card>
                <CardTitle className="mb-3">Legacy</CardTitle>
                <p className="text-muted leading-relaxed">{legend.legacy}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
