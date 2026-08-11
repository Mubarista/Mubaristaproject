"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Trophy, Play, ThumbsUp, Loader2 } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";

interface LeaderboardRow {
  id: string;
  rank: number;
  fullName: string;
  country: string;
  votePoints: number;
  judgeScore: number;
  score: number;
  videoUrl: string;
  profilePhotoUrl: string;
  applicationId: string;
}

export default function LeaderboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState<{ id: string; title: string; status: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [voting, setVoting] = useState<string | null>(null);

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`/api/competitions/leaderboard?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCompetition(data.competition);
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, [slug]);

  useEffect(() => {
    if (!competition) return;

    const channel = supabase
      .channel(`leaderboard-${competition.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competition_results",
          filter: `competition_id=eq.${competition.id}`,
        },
        () => fetchLeaderboard()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "competition_votes",
          filter: `competition_id=eq.${competition.id}`,
        },
        () => fetchLeaderboard()
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Leaderboard realtime channel error:", status);
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [competition?.id]);

  async function handleVote(applicationId: string) {
    if (!user) {
      window.location.href = `/login?returnTo=/competitions/${encodeURIComponent(slug)}/leaderboard`;
      return;
    }

    setVoting(applicationId);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/competitions/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ applicationId }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(result.error || "Failed to vote");
      } else {
        await fetchLeaderboard();
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVoting(null);
    }
  }

  const isVoting = competition?.status === "voting";
  const showWinners = competition?.status === "winner_announcement" || competition?.status === "ended";

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <LoadingDots />
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-muted">Competition not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{competition.title}</h1>
          <p className="text-muted mt-2">{showWinners ? "Winners" : "Live Leaderboard"}</p>
          <Badge className="mt-3" variant={isVoting ? "green" : showWinners ? "yellow" : "default"}>
            {competition.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {leaderboard.length === 0 ? (
          <Card className="p-8 text-center">
            <CardTitle className="text-muted">No entries yet</CardTitle>
          </Card>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted-bg text-lg font-bold">
                    {entry.rank === 1 ? <Trophy className="h-5 w-5 text-yellow" /> : entry.rank}
                  </div>
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    {entry.profilePhotoUrl ? (
                      <Image src={entry.profilePhotoUrl} alt={entry.fullName} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted-bg text-xs text-muted">N/A</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{entry.fullName}</p>
                    <p className="text-sm text-muted">{entry.country || "—"}</p>
                  </div>
                  <div className="hidden sm:flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-muted text-xs">Votes</p>
                      <p className="font-medium">{entry.votePoints}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted text-xs">Judge</p>
                      <p className="font-medium">{Number(entry.judgeScore).toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted text-xs">Total</p>
                      <p className="font-bold text-green">{Number(entry.score).toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.videoUrl && (
                      <a href={entry.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">
                        <Play className="h-5 w-5" />
                      </a>
                    )}
                    {isVoting && (
                      <Button
                        size="sm"
                        onClick={() => handleVote(entry.applicationId)}
                        disabled={voting === entry.applicationId}
                      >
                        {voting === entry.applicationId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href={`/competitions/${encodeURIComponent(slug)}`} className="text-blue hover:underline text-sm">
            Back to competition
          </Link>
        </div>
      </div>
    </div>
  );
}
