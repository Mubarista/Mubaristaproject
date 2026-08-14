"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardTitle } from "@/components/ui/card";
import { Trophy, Globe, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardRow {
  id: string;
  rank: number;
  fullName: string;
  country: string;
  competitionTitle: string;
  profilePhotoUrl: string;
  votes: number;
  totalScore: number;
}

export default function LiveLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchLeaderboard() {
    try {
      const res = await fetch("/api/competitions/leaderboard", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAvailable(data.available);
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching live leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();

    const resultsChannel = supabase
      .channel("global-leaderboard-results")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competition_results" },
        () => fetchLeaderboard()
      )
      .subscribe();

    const votesChannel = supabase
      .channel("global-leaderboard-votes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "competition_votes" },
        () => fetchLeaderboard()
      )
      .subscribe();

    const interval = setInterval(fetchLeaderboard, 5000);

    return () => {
      resultsChannel.unsubscribe();
      votesChannel.unsubscribe();
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(votesChannel);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto"></div>
        </div>
      </div>
    );
  }

  if (available === false) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Trophy className="h-16 w-16 mx-auto text-muted mb-4" />
          <h1 className="text-2xl font-bold mb-2">Leaderboard Not Available</h1>
          <p className="text-muted">
            There are no competitions available right now. The live leaderboard will appear once competitions open.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Live Leaderboard</h1>
          <p className="text-muted max-w-2xl mx-auto">
            Real-time rankings of all applicants across every available competition.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow" /> Rankings
            </CardTitle>
            <Badge variant="green" className="animate-pulse">Live</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted-bg/50 text-muted uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Rank</th>
                  <th className="px-6 py-3 text-left font-medium">Applicant</th>
                  <th className="px-6 py-3 text-left font-medium">
                    <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Country</span>
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Competition</span>
                  </th>
                  <th className="px-6 py-3 text-right font-medium">Total Votes</th>
                  <th className="px-6 py-3 text-right font-medium">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted">
                      No applicants found yet.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold ${
                          row.rank === 1 ? "bg-yellow/20 text-yellow" :
                          row.rank === 2 ? "bg-muted text-foreground" :
                          row.rank === 3 ? "bg-orange/20 text-orange" :
                          "bg-white/5 text-muted"
                        }`}>
                          {row.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{row.fullName}</td>
                      <td className="px-6 py-4 text-muted">{row.country || "—"}</td>
                      <td className="px-6 py-4 text-muted">{row.competitionTitle}</td>
                      <td className="px-6 py-4 text-right font-medium">{row.votes}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue">{row.totalScore}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
