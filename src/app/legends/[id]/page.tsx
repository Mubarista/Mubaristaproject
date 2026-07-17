import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trophy, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LegendDetailPage({ params }: Props) {
  const { id } = await params;
  let legend: any = null;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const res = await fetch(`${baseUrl}/api/legends`, {
      cache: "no-store",
    });
    if (res.ok) {
      const all = await res.json();
      legend = Array.isArray(all) ? all.find((l: any) => l.id === id) : null;
    }
  } catch {}
  if (!legend) notFound();

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/legends" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Legends
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted-bg">
              {legend.image ? (
                <Image src={legend.image} alt={legend.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted">
                  No image available
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{legend.name}</h1>
              <p className="text-muted">{legend.country}</p>
            </div>

            <Card>
              <CardTitle className="mb-3">Biography</CardTitle>
              <p className="text-muted leading-relaxed">{legend.biography}</p>
            </Card>

            <Card>
              <CardTitle className="mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow" /> Achievements
              </CardTitle>
              <ul className="space-y-2">
                {legend.achievements.map((a: string) => (
                  <li key={a} className="flex items-start gap-2 text-sm">
                    <span className="text-green mt-1">✓</span> {a}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardTitle className="mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue" /> Awards
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {legend.awards.map((a: string) => (
                  <Badge key={a} variant="yellow">{a}</Badge>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-3">Legacy</CardTitle>
              <p className="text-muted leading-relaxed">{legend.legacy}</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
