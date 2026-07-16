"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Upload,
  Bell,
  Award,
  CreditCard,
  BarChart3,
  MessageSquare,
  FileText,
  Wallet,
  AlertCircle,
  X,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLiveScores } from "@/lib/use-live-scores";
import type { CompetitionApplication, CompetitionResult } from "@/types";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read?: boolean;
  link?: string;
  createdAt: string;
}

interface PaymentItem {
  id: string;
  type: string;
  description?: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  paidAt?: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
  totalEarnings: number;
}

interface MessageItem {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function ParticipantDashboardContent() {
  const { user, isPremium } = useAuth();
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("token");
  const [application, setApplication] = useState<CompetitionApplication | null>(null);
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWinner, setIsWinner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [competitionId, setCompetitionId] = useState<string | null>(null);

  async function fetchResults(app: CompetitionApplication) {
    try {
      const compId = app?.competitionId || app?.competition?.id;
      if (compId) setCompetitionId(compId);

      let resultData: CompetitionResult[] = [];

      if (compId) {
        const liveResponse = await fetch(`/api/competitions/live-results?competitionId=${compId}`);
        if (liveResponse.ok) {
          resultData = (await liveResponse.json()) as CompetitionResult[];
        }
      }

      if (resultData.length === 0) {
        const resultsResponse = await fetch(`/api/competitions/results`);
        if (resultsResponse.ok) {
          resultData = (await resultsResponse.json()) as CompetitionResult[];
        }
      }

      setResults(resultData);
      const displayName = user?.name || app?.fullName || "";
      const userResult = resultData.find((r) => {
        if (!displayName) return false;
        return r.participantName?.toLowerCase() === displayName.toLowerCase();
      });
      if (userResult && userResult.isWinner) {
        setIsWinner(true);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  }

  useLiveScores(competitionId, () => {
    if (application) {
      fetchResults(application);
    }
  });

  async function fetchNotifications(app: CompetitionApplication) {
    try {
      const targetUserId = user?.id || app?.userId;
      if (!targetUserId) return;
      const response = await fetch(`/api/notifications?userId=${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data as NotificationItem[]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  async function fetchPayments(app: CompetitionApplication) {
    try {
      const targetUserId = user?.id || app?.userId;
      const targetEmail = app?.userEmail || app?.email;
      const params = new URLSearchParams();
      if (targetUserId) params.set("userId", targetUserId);
      if (targetEmail) params.set("userEmail", targetEmail);
      const query = params.toString();
      if (!query) return;
      const response = await fetch(`/api/payments?${query}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data as PaymentItem[]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }

  async function fetchWallet(app: CompetitionApplication) {
    try {
      const targetUserId = user?.id || app?.userId;
      if (!targetUserId) return;
      const response = await fetch(`/api/wallet?userId=${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setWallet(data as WalletData);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  }

  async function fetchMessages(app: CompetitionApplication) {
    try {
      const targetUserId = user?.id || app?.userId;
      const targetEmail = app?.userEmail || app?.email;
      const params = new URLSearchParams();
      if (targetUserId) params.set("userId", targetUserId);
      if (targetEmail) params.set("email", targetEmail);
      const query = params.toString();
      if (!query) return;
      const response = await fetch(`/api/messages?${query}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data as MessageItem[]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function fetchParticipantData() {
    try {
      setError(null);

      // If an access token is provided, load the anonymous application directly
      if (accessToken) {
        const response = await fetch(`/api/access/validate?token=${accessToken}`);
        if (response.ok) {
          const data = (await response.json()) as CompetitionApplication;
          if (data.status === "revoked" || data.status === "rejected" || data.status === "archived") {
            setError("Access revoked. Your application has been revoked and your access link is blocked. Please contact support for assistance.");
            return;
          }
          setApplication(data);
          await fetchResults(data);
          await fetchNotifications(data);
          await fetchPayments(data);
          await fetchWallet(data);
          await fetchMessages(data);
          return;
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error === "revoked") {
            setError("Access revoked. Your application has been revoked and your access link is blocked. Please contact support for assistance.");
          } else {
            setError(errorData.error === "expired" ? "This access link has expired." : "Invalid access link.");
          }
          return;
        }
      }

      // Fall back to authenticated user
      if (user) {
        const emailParam = user.email ? `&userEmail=${encodeURIComponent(user.email)}` : "";
        const appResponse = await fetch(`/api/competitions/apply?userId=${user.id}${emailParam}`);
        if (appResponse.ok) {
          const apps = await appResponse.json();
          if (apps.length > 0) {
            const app = apps[0] as CompetitionApplication;
            if (app.status === "revoked" || app.status === "rejected" || app.status === "archived") {
              setError("Access revoked. Your application has been revoked and your dashboard access is blocked. Please contact support for assistance.");
              return;
            }
            setApplication(app);
            await fetchResults(app);
            await fetchNotifications(app);
            await fetchPayments(app);
            await fetchWallet(app);
            await fetchMessages(app);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching participant data:", error);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchParticipantData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  const displayName = user?.name || application?.fullName || "Barista";

  const userResult = results.find((r) => {
    if (!displayName) return false;
    return r.participantName?.toLowerCase() === displayName.toLowerCase();
  });
  const userRank = userResult ? userResult.rank : null;
  const userScore = userResult ? userResult.score : null;
  const awards = results.filter((r) => {
    if (!displayName) return false;
    return r.participantName?.toLowerCase() === displayName.toLowerCase() && r.isWinner;
  });

  const stats = [
    { label: "Live Ranking", value: userRank ? `#${userRank}` : "N/A", icon: Trophy, color: "text-yellow" },
    { label: "Judge Score", value: userScore ? `${userScore}/10` : "N/A", icon: BarChart3, color: "text-green" },
    { label: "Application Status", value: application?.status || "N/A", icon: Award, color: "text-blue" },
    { label: "Payment Status", value: application?.paymentStatus || "N/A", icon: CreditCard, color: isWinner ? "text-green" : "text-muted" },
    ...(wallet
      ? [{
          label: "Wallet",
          value: `${wallet.balance} ${wallet.currency}`,
          icon: Wallet,
          color: "text-yellow" as const,
        }]
      : []),
  ];

  const unreadMessages = messages.filter((m) => m.status === "unread").length;

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadUrl(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", file.type.startsWith("video/") ? "video" : "photo");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (response.ok) {
        const data = await response.json();
        setUploadUrl(data.url);
      } else {
        alert("Failed to upload file.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  }

  async function saveSubmissionUrl() {
    if (!uploadUrl || !application?.id) return;
    try {
      const response = await fetch(`/api/competitions/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: uploadUrl }),
      });
      if (response.ok) {
        alert("Submission saved successfully!");
        setActiveModal(null);
      } else {
        alert("Failed to save submission.");
      }
    } catch (error) {
      console.error("Save submission error:", error);
      alert("Failed to save submission.");
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    const isRevoked = error.toLowerCase().includes("revoked");
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="h-16 w-16 text-red mx-auto mb-4" />
          <CardTitle className="mb-2">{isRevoked ? "Access Revoked" : "Access Error"}</CardTitle>
          <p className="text-muted mb-6">{error}</p>
          <Button variant="secondary" onClick={() => window.location.href = "/competitions"}>
            Browse Competitions
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {displayName}
            </h1>
            <p className="text-muted">Participant Dashboard</p>
          </div>
          <div className="flex gap-3">
            {isWinner && (
              <Link href="/wallet">
                <Button variant="premium">
                  <Wallet className="h-4 w-4" /> View Wallet
                </Button>
              </Link>
            )}
            {isPremium && <Badge variant="premium">Premium Member</Badge>}
          </div>
        </div>

        <div className={`grid grid-cols-2 ${stats.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-8`}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="text-center">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardTitle className="mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow" /> Live Competition Results
            </CardTitle>
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.slice(0, 10).map((result, index) => {
                  const isCurrent = displayName && result.participantName?.toLowerCase() === displayName.toLowerCase();
                  return (
                    <div
                      key={result.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        isCurrent ? "bg-blue/10 border border-blue/30" : "bg-muted-bg"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${index < 3 ? "text-yellow" : "text-muted"}`}>
                          #{result.rank}
                        </span>
                        <span className="text-sm">{result.participantName}</span>
                        {result.isWinner && <Badge variant="premium">Winner</Badge>}
                      </div>
                      <span className="font-mono text-sm">{result.score}/10</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted text-sm">No results available yet</p>
            )}
          </Card>

          <div className="space-y-6">
            <Card>
              <CardTitle className="mb-3 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue" /> Notifications
              </CardTitle>
              <div className="space-y-2 text-sm">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className={`p-2 rounded-lg ${n.read ? "bg-muted-bg" : "bg-blue/10 border border-blue/30"}`}>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <>
                    {application?.status === "pending" && <p>⏳ Application under review</p>}
                    {application?.status === "nominated" && <p>✅ Application nominated</p>}
                    {application?.status === "rejected" && <p>❌ Application rejected</p>}
                    {application?.paymentStatus === "paid" && <p>💳 Payment completed</p>}
                    {isWinner && <p>🏆 Congratulations! You won!</p>}
                    {!application?.status && <p className="text-muted">No notifications yet</p>}
                  </>
                )}
              </div>
            </Card>
            <Card>
              <CardTitle className="mb-3 flex items-center gap-2">
                <Upload className="h-5 w-5 text-green" /> Quick Actions
              </CardTitle>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" size="sm" onClick={() => setActiveModal("certificates")}>
                  <FileText className="h-4 w-4" /> View Certificates
                </Button>
                <Button variant="ghost" className="w-full" size="sm" onClick={() => setActiveModal("payments")}>
                  <CreditCard className="h-4 w-4" /> Payment History
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card
            className="cursor-pointer hover:border-blue/50 transition-colors"
            onClick={() => setActiveModal("awards")}
          >
            <Award className="h-6 w-6 text-blue mb-2" />
            <CardTitle className="text-base">Awards</CardTitle>
            <p className="text-sm text-muted">
              {awards.length > 0 ? `${awards.length} award${awards.length > 1 ? "s" : ""}` : "View your competition awards"}
            </p>
          </Card>

          <Link href="/dashboard/user/messages">
            <Card className="cursor-pointer hover:border-blue/50 transition-colors">
              <MessageSquare className="h-6 w-6 text-blue mb-2" />
              <CardTitle className="text-base">Messages</CardTitle>
              <p className="text-sm text-muted">
                {unreadMessages > 0 ? `${unreadMessages} unread` : "View your messages"}
              </p>
            </Card>
          </Link>

          <Card
            className="cursor-pointer hover:border-blue/50 transition-colors"
            onClick={() => setActiveModal("results")}
          >
            <BarChart3 className="h-6 w-6 text-blue mb-2" />
            <CardTitle className="text-base">Results</CardTitle>
            <p className="text-sm text-muted">
              {userRank ? `Rank #${userRank} - ${userScore}/10` : "View judge scores & ranking"}
            </p>
          </Card>
        </div>

        {/* Modals */}
        {activeModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full p-6 relative max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {activeModal === "upload" && (
                <div className="space-y-4">
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" /> Upload Submission
                  </CardTitle>
                  <p className="text-sm text-muted">
                    Upload your competition video or profile photo. Supported files: images, videos.
                  </p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full text-sm"
                  />
                  {uploading && <p className="text-sm text-muted">Uploading...</p>}
                  {uploadUrl && (
                    <div className="text-sm text-green flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Uploaded successfully
                    </div>
                  )}
                  {uploadUrl && (
                    <Button className="w-full" onClick={saveSubmissionUrl}>
                      Save to Application
                    </Button>
                  )}
                </div>
              )}

              {activeModal === "certificates" && (
                <div className="space-y-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Certificates
                  </CardTitle>
                  {isWinner ? (
                    <div className="text-center space-y-4">
                      <div className="p-6 border border-yellow/30 rounded-xl bg-yellow/5">
                        <h3 className="text-xl font-bold text-yellow mb-2">Certificate of Achievement</h3>
                        <p className="text-sm">This certifies that</p>
                        <p className="text-2xl font-bold my-2">{displayName}</p>
                        <p className="text-sm">is a winner of</p>
                        <p className="text-lg font-medium">{application?.competition?.title}</p>
                      </div>
                      <Button className="w-full" onClick={() => window.print()}>
                        <ExternalLink className="h-4 w-4" /> Print Certificate
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted">No certificates available. You will receive a certificate when you win a competition.</p>
                  )}
                </div>
              )}

              {activeModal === "payments" && (
                <div className="space-y-4">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Payment History
                  </CardTitle>
                  {payments.length > 0 ? (
                    <div className="space-y-2">
                      {payments.map((p) => (
                        <div key={p.id} className="p-3 rounded-lg bg-muted-bg flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{p.description || p.type}</p>
                            <p className="text-xs text-muted">{p.method} • {new Date(p.paidAt || p.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={p.status === "paid" || p.status === "completed" ? "green" : "blue"}>
                            {p.amount} {p.currency}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No payments found.</p>
                  )}
                </div>
              )}

              {activeModal === "awards" && (
                <div className="space-y-4">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" /> Awards
                  </CardTitle>
                  {awards.length > 0 ? (
                    <div className="space-y-2">
                      {awards.map((a) => (
                        <div key={a.id} className="p-3 rounded-lg bg-yellow/10 border border-yellow/30">
                          <p className="font-medium text-yellow">Winner - {application?.competition?.title}</p>
                          <p className="text-sm text-muted">Score: {a.score}/10 • Rank: #{a.rank}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No awards yet. Keep competing!</p>
                  )}
                </div>
              )}

              {activeModal === "results" && (
                <div className="space-y-4">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Results
                  </CardTitle>
                  {userResult ? (
                    <div className="p-4 rounded-lg bg-muted-bg">
                      <p className="text-sm">Rank: <span className="font-bold">#{userResult.rank}</span></p>
                      <p className="text-sm">Score: <span className="font-bold">{userResult.score}/10</span></p>
                      {userResult.feedback && (
                        <p className="text-sm mt-2 text-muted">{userResult.feedback}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted">Your results will appear here once judging is complete.</p>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
