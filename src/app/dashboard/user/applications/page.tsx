"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import {
  FileText,
  Trophy,
  Calendar,
  CreditCard,
  User,
  MapPin,
  Phone,
  ChevronDown,
} from "lucide-react";

interface UserApplication {
  id: string;
  competitionId?: string;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  fullName?: string;
  userName?: string;
  country?: string;
  mobileNumber?: string;
  competitionTitle?: string | null;
  competitionSlug?: string | null;
  competitionStatus?: string | null;
}

function formatDate(date?: string) {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
}

function formatLabel(status?: string | null) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusVariant(
  status?: string | null
): "green" | "yellow" | "red" | "blue" | "premium" {
  const s = (status || "").toLowerCase();
  if (["approved", "paid", "completed"].includes(s)) return "green";
  if (["nominated"].includes(s)) return "premium";
  if (["pending", "unpaid"].includes(s)) return "yellow";
  if (["rejected", "revoked", "lost", "loss"].includes(s)) return "red";
  return "blue";
}

export default function UserApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role === "admin") {
      setLoading(false);
      return;
    }

    fetchApplications();

    const interval = setInterval(() => {
      fetchApplications();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  async function fetchApplications() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/applications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setApplications((data as UserApplication[]) || []);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Please log in to view your applications</p>
      </div>
    );
  }

  if (user.role === "admin") {
    router.push("/muba2-admin");
    return null;
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Applications</h1>
            <p className="text-muted">Track your competition entries and statuses</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/competitions")}>
            <Trophy className="h-4 w-4" /> Browse Competitions
          </Button>
        </div>

        {applications.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No applications yet</h2>
            <p className="text-muted mb-6">
              You haven't applied to any competitions yet. Browse our live competitions and apply.
            </p>
            <Button variant="primary" onClick={() => router.push("/competitions")}>
              <Trophy className="h-4 w-4" /> Browse Competitions
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {applications.map((app) => (
              <Card key={app.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {app.competitionSlug ? (
                      <Link
                        href={`/competitions/${app.competitionSlug}`}
                        className="hover:text-blue transition-colors"
                      >
                        <CardTitle className="text-lg leading-tight">
                          {app.competitionTitle || "Unknown Competition"}
                        </CardTitle>
                      </Link>
                    ) : (
                      <CardTitle className="text-lg leading-tight">
                        {app.competitionTitle || "Unknown Competition"}
                      </CardTitle>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Applied {formatDate(app.createdAt)}</span>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(app.status)} className="shrink-0">
                    {formatLabel(app.status)}
                  </Badge>
                </div>

                {app.paymentStatus && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted" />
                    <span className="text-muted">Payment:</span>
                    <Badge variant={getStatusVariant(app.paymentStatus)}>
                      {formatLabel(app.paymentStatus)}
                    </Badge>
                  </div>
                )}

                <details className="group mt-4 border-t border-white/5 pt-4">
                  <summary className="flex cursor-pointer items-center justify-between text-sm text-muted hover:text-foreground transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Application details
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-muted">
                    {(app.fullName || app.userName) && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-foreground">{app.fullName || app.userName}</span>
                      </div>
                    )}
                    {app.country && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{app.country}</span>
                      </div>
                    )}
                    {app.mobileNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{app.mobileNumber}</span>
                      </div>
                    )}
                    {!app.fullName && !app.userName && !app.country && !app.mobileNumber && (
                      <p>No additional details provided.</p>
                    )}
                  </div>
                </details>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
