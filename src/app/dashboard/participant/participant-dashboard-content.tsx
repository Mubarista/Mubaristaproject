"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LiveChatContent } from "./live-chat-content";
import { WithdrawalModal } from "./withdrawal-modal";
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
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/shared/countdown";
import { useLiveScores } from "@/lib/use-live-scores";
import { LiveScoringLeaderboard } from "@/components/leaderboard/live-scoring-leaderboard";
import { ErrorPopup } from "@/components/ui/error-popup";
import { SuccessPopup } from "@/components/ui/success-popup";
import { uploadWithRetry } from "@/lib/resumable-upload";
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

export default function ParticipantDashboardContent() {
  const { user, isPremium } = useAuth();
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("token");
  const [application, setApplication] = useState<CompetitionApplication | null>(null);
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWinner, setIsWinner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<{ participantName: string; videoUrl: string; completed: boolean; currentJudge?: { id: string; name: string } | null; judgesDone?: number; totalJudges?: number } | null>(null);
  const [videoSubmissionOpen, setVideoSubmissionOpen] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [errorPopup, setErrorPopup] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });
  const [successPopup, setSuccessPopup] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  const isSubmissionOpen = useMemo(
    () => application?.competition?.status === "in_progress",
    [application?.competition?.status]
  );

  useEffect(() => {
    const timeline = application?.competition?.eventTimeline || [];
    const inProgressEvent = timeline.find(
      (t) =>
        t.phase === "in_progress" ||
        /submissions?\s*open|upload|video|in\s*progress/i.test(t.event || "")
    );
    setVideoSubmissionOpen(inProgressEvent?.date || null);
  }, [application?.competition?.eventTimeline]);

  async function fetchResults(app: CompetitionApplication) {
    try {
      const compId = app?.competitionId || app?.competition?.id;
      if (compId) setCompetitionId(compId);

      // Fetch current video judges are scoring
      if (compId) {
        const videoRes = await fetch(`/api/competitions/current-scoring-video?competitionId=${compId}`);
        if (videoRes.ok) {
          const videoData = await videoRes.json();
          setCurrentVideo(videoData.current || null);
        }
      }

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
      setIsWinner(userResult?.isWinner || false);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  }

  useLiveScores(competitionId, () => {
    if (application) {
      fetchResults(application);
      fetchNotifications(application);
    }
  });

  // Listen for judge video playback state
  useEffect(() => {
    if (!competitionId) return;

    const channel = supabase
      .channel(`competition-video-${competitionId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "video-state" }, (payload) => {
        const video = videoRef.current;
        if (!video) return;

        const { type, currentTime, applicationId } = payload.payload as { type: string; currentTime?: number; applicationId?: string };

        // Ignore state from other applications
        if (applicationId && currentVideo?.videoUrl && !currentVideo.videoUrl.includes(applicationId)) {
          // still allow because currentVideo is tied to the active application
        }

        if (typeof currentTime === "number" && Math.abs(video.currentTime - currentTime) > 1) {
          video.currentTime = currentTime;
        }

        if (type === "play") {
          video.play().catch(() => {});
        } else if (type === "pause") {
          video.pause();
        } else if (type === "seek" || type === "time") {
          if (typeof currentTime === "number") {
            video.currentTime = currentTime;
          }
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [competitionId, currentVideo?.videoUrl]);

  // Track fullscreen state
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  useEffect(() => {
    if (!competitionId) return;

    const tables = ["competition_results", "competition_votes"];
    const channels = tables.map((table) =>
      supabase
        .channel(`participant-${table}-${competitionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `competition_id=eq.${competitionId}`,
          },
          () => {
            if (application) {
              fetchResults(application);
              fetchNotifications(application);
            }
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      });
    };
  }, [competitionId, application, fetchResults, fetchNotifications]);

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

  async function refreshApplicationData() {
    if (!user) return;
    try {
      const res = await fetch(`/api/competitions/applications?userId=${user.id}`);
      if (res.ok) {
        const apps = await res.json();
        const currentApp = apps.find((a: CompetitionApplication) => a.id === application?.id);
        if (currentApp) {
          setApplication(currentApp);
        }
      }
    } catch (error) {
      console.error("Error refreshing application data:", error);
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
  const maxVideoDuration = application?.competition?.maxVideoDuration;
  const maxVideoSize = application?.competition?.maxVideoSize;
  const durationText = maxVideoDuration ? `${maxVideoDuration} seconds` : "the administrator's limit";
  const sizeText = maxVideoSize ? `${maxVideoSize} MB` : "the administrator's limit";

  const userResult = results.find((r) => {
    if (!displayName) return false;
    return r.participantName?.toLowerCase() === displayName.toLowerCase();
  });
  const userRank = userResult ? userResult.rank : null;
  const userScore = userResult ? userResult.score : null;
  const awards = results.filter((r) => {
    if (!displayName) return false;
    return r.participantName?.toLowerCase() === displayName.toLowerCase() && !!r.medal;
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
          action: isWinner && wallet.balance > 0 ? () => setActiveModal("withdraw") : undefined,
        }]
      : []),
  ];

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxDuration = application?.competition?.maxVideoDuration;
    const maxSize = application?.competition?.maxVideoSize;

    if (!file.type.startsWith("video/")) {
      setErrorPopup({
        open: true,
        title: "Invalid File Type",
        message: "Only video files are accepted for competition submissions.",
      });
      return;
    }

    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setErrorPopup({
        open: true,
        title: "File Size Exceeded",
        message: `Video file size must not exceed ${maxSize} MB.`,
      });
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Could not load video metadata"));
      });

      if (maxDuration && video.duration > maxDuration) {
        URL.revokeObjectURL(objectUrl);
        setErrorPopup({
          open: true,
          title: "Duration Exceeded",
          message: `Video duration must not exceed ${maxDuration} seconds.`,
        });
        return;
      }

      if (video.videoWidth <= video.videoHeight) {
        URL.revokeObjectURL(objectUrl);
        setErrorPopup({
          open: true,
          title: "Orientation Required",
          message: "Video must be in landscape (horizontal) orientation.",
        });
        return;
      }

      if (video.videoHeight < 864 || video.videoHeight > 1080) {
        URL.revokeObjectURL(objectUrl);
        setErrorPopup({
          open: true,
          title: "Resolution Required",
          message: "Video resolution must be between 1920×864 and 1920×1080 in landscape orientation.",
        });
        return;
      }

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      console.error("Video validation error:", error);
      setErrorPopup({
        open: true,
        title: "Validation Error",
        message: "Could not validate the video. Please try a different file.",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadUrl(null);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      
      const data = await uploadWithRetry(
        file,
        "Videos",
        fileName,
        file.type,
        (progress) => {
          setUploadProgress(progress.percentage);
        },
        3 // max retries
      );

      setUploadUrl(data.url);
      console.log("Upload successful:", data.url);
    } catch (error) {
      console.error("Upload error:", error);
      setErrorPopup({
        open: true,
        title: "Upload Failed",
        message: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function saveSubmissionUrl() {
    if (!uploadUrl || !application?.id) return;
    if (!termsAccepted) {
      setErrorPopup({
        open: true,
        title: "Terms Required",
        message: "You must read and accept the terms and conditions before submitting.",
      });
      return;
    }
    try {
      const response = await fetch(`/api/competitions/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: uploadUrl }),
      });
      if (response.ok) {
        setSuccessPopup({
          open: true,
          title: "Submission Saved",
          message: "Your competition video has been successfully submitted.",
        });
        setActiveModal(null);
        // Refresh application data to update UI
        await refreshApplicationData();
      } else {
        setErrorPopup({
          open: true,
          title: "Save Failed",
          message: "Failed to save submission. Please try again.",
        });
      }
    } catch (error) {
      console.error("Save submission error:", error);
      setErrorPopup({
        open: true,
        title: "Save Failed",
        message: "Failed to save submission. Please try again.",
      });
    }
  }

  if (loading) {
    return (
      <div className="pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    const isRevoked = error.toLowerCase().includes("revoked");
    return (
      <div className="pb-16 min-h-screen flex items-center justify-center px-4">
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
    <div className="pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {competitionId ? (
                  <LiveScoringLeaderboard competitionId={competitionId} title="Live Competition Results" />
                ) : (
                  <p className="text-muted text-sm">No results available yet</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted">Video judges are scoring</p>
                {(() => {
                  return currentVideo?.videoUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white font-medium truncate">{currentVideo.participantName}</p>
                        {currentVideo.currentJudge && (
                          <span className="text-xs" style={{ color: "#c9a227" }}>
                            Turn: {currentVideo.currentJudge.name}
                          </span>
                        )}
                      </div>
                      <div ref={wrapperRef} className="relative w-full h-40 rounded-xl bg-black overflow-hidden group">
                        <video
                          ref={videoRef}
                          src={currentVideo.videoUrl}
                          autoPlay
                          muted={isMuted}
                          loop
                          preload="metadata"
                          playsInline
                          controls={false}
                          disablePictureInPicture
                          controlsList="nodownload noremoteplayback"
                          onContextMenu={e => e.preventDefault()}
                          onClick={e => e.preventDefault()}
                          onDoubleClick={e => e.preventDefault()}
                          tabIndex={-1}
                          className="w-full h-full object-contain bg-black"
                        />
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide text-white"
                          style={{ background: "rgba(220,38,38,0.9)", boxShadow: "0 0 0 2px rgba(220,38,38,0.4)" }}>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          LIVE
                        </div>
                        <div className={"absolute bottom-0 inset-x-0 p-2 flex items-center justify-between transition-opacity " + (isFullscreen ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setIsMuted(v => {
                                  const next = !v;
                                  if (videoRef.current) videoRef.current.muted = next;
                                  return next;
                                });
                              }}
                              className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
                              aria-label="Toggle volume"
                            >
                              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              if (!document.fullscreenElement && wrapperRef.current?.requestFullscreen) {
                                wrapperRef.current.requestFullscreen();
                              } else if (document.exitFullscreen) {
                                document.exitFullscreen();
                              }
                            }}
                            className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
                            aria-label="Full screen"
                          >
                            {isFullscreen ? <X className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {currentVideo.totalJudges && currentVideo.totalJudges > 1 && (
                        <p className="text-xs" style={{ color: "#6b7280" }}>
                          {currentVideo.judgesDone || 0} of {currentVideo.totalJudges} judges have scored this participant
                        </p>
                      )}
                    </div>
                  ) : currentVideo?.completed ? (
                    <div className="w-full h-40 rounded-xl bg-black flex items-center justify-center">
                      <span className="text-xs text-muted text-center px-2">Judging has been completed</span>
                    </div>
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-black flex items-center justify-center">
                      <span className="text-xs text-muted text-center px-2">No current video to display</span>
                    </div>
                  );
                })()}
              </div>
            </div>
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
                <Button
                  variant={application?.videoUrl ? "secondary" : "premium"}
                  className="w-full"
                  size={application?.videoUrl ? "sm" : "lg"}
                  disabled={!!application?.videoUrl || (!isSubmissionOpen)}
                  title={
                    application?.videoUrl
                      ? "Video already submitted"
                      : isSubmissionOpen
                      ? "Submit your competition video"
                      : "Video submissions are not open right now"
                  }
                  onClick={() => !application?.videoUrl && setActiveModal("upload")}
                >
                  {application?.videoUrl ? (
                    <>
                      <CheckCircle className="h-4 w-4" /> Submitted
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Submit Competition Video
                    </>
                  )}
                </Button>

                {!application?.videoUrl && !isSubmissionOpen && videoSubmissionOpen && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted mt-2">
                    <span>Submissions open in</span>
                    <Countdown deadline={videoSubmissionOpen} closedText="Submissions open now" />
                  </div>
                )}
                {!application?.videoUrl && !isSubmissionOpen && !videoSubmissionOpen && (
                  <p className="text-xs text-muted text-center mt-2">Submissions are currently closed</p>
                )}
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

          <Card
            className="cursor-pointer hover:border-blue/50 transition-colors"
            onClick={() => setActiveModal("liveChat")}
          >
            <MessageSquare className="h-6 w-6 text-blue mb-2" />
            <CardTitle className="text-base">Live Chat</CardTitle>
            <p className="text-sm text-muted">Feedback & comments</p>
          </Card>

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
            <Card className={`${activeModal === "liveChat" ? "max-w-3xl" : "max-w-lg"} w-full p-6 relative max-h-[80vh] overflow-y-auto`}>
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {activeModal === "liveChat" && (
                <LiveChatContent
                  competitionId={competitionId || ""}
                  participantName={displayName}
                  userId={user?.id || displayName}
                  className="h-[70vh]"
                />
              )}

              {activeModal === "upload" && (
                <div className="space-y-4">
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" /> {application?.videoUrl ? "Submitted Video" : "Competition Video Submission"}
                  </CardTitle>

                  {application?.videoUrl ? (
                    <div className="space-y-3">
                      <p className="text-sm text-green flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Your competition video has been submitted.
                      </p>
                      <p className="text-sm text-muted">
                        Submissions are final. You cannot re-upload or modify your video.
                      </p>
                      <a
                        href={application.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue break-all block"
                      >
                        {application.videoUrl}
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted-bg text-sm space-y-2 text-muted max-h-48 overflow-y-auto">
                        <p className="font-medium text-foreground">Terms & Conditions</p>
                        <p>By submitting your competition video, you confirm that:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>The video is your own original work created for this competition.</li>
                          <li>You have not copied, edited, or re-used previous recordings.</li>
                          <li>Once submitted, the video cannot be re-uploaded or modified.</li>
                          <li>You have reviewed the video carefully before submitting.</li>
                          <li>The video has good lighting and clear audio/visual quality.</li>
                          <li>The video is in landscape (horizontal) orientation with resolution between 1920×864 and 1920×1080.</li>
                          <li>The video length does not exceed {durationText}.</li>
                          <li>The video file size does not exceed {sizeText}.</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                          Notice: All uploaded competition videos will be permanently deleted from our servers once the competition officially closes.
                        </p>
                      </div>

                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-1"
                        />
                        <span>
                          I have read and accept the terms. I understand my submission is final and cannot be changed.
                        </span>
                      </label>

                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        disabled={uploading || !termsAccepted}
                        className="block w-full cursor-pointer text-sm text-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-blue file:bg-gradient-to-r file:from-yellow file:via-green file:to-blue file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      {uploading && (
                        <div className="space-y-2 w-full">
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue transition-all duration-200"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-muted text-center">Uploading... {uploadProgress}%</p>
                        </div>
                      )}
                      {uploadUrl && (
                        <div className="text-sm text-green flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Uploaded successfully
                        </div>
                      )}
                      {uploadUrl && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted">Preview</p>
                          <video
                            src={uploadUrl}
                            controls
                            className="w-full max-h-48 rounded-xl bg-black"
                          />
                        </div>
                      )}
                      {uploadUrl && (
                        <Button
                          variant="premium"
                          size="lg"
                          className="w-full"
                          onClick={saveSubmissionUrl}
                          disabled={!termsAccepted}
                        >
                          Save to Application
                        </Button>
                      )}
                    </div>
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
                        <div
                          key={a.id}
                          className={`p-3 rounded-lg border ${
                            a.medal === "gold"
                              ? "bg-yellow/10 border-yellow/30"
                              : a.medal === "diamond"
                              ? "bg-blue/10 border-blue/30"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <p
                            className={`font-medium ${
                              a.medal === "gold"
                                ? "text-yellow"
                                : a.medal === "diamond"
                                ? "text-blue"
                                : "text-white"
                            }`}
                          >
                            {a.medal === "gold" && "🥇 Gold - Winner"}
                            {a.medal === "diamond" && "💎 Diamond"}
                            {a.medal === "silver" && "🥈 Silver"} - {application?.competition?.title}
                          </p>
                          <p className="text-sm text-muted">Score: {a.score}/10 • Rank: #{a.rank}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No awards yet. Judging is still in progress.</p>
                  )}
                </div>
              )}

              {activeModal === "withdraw" && (
                <WithdrawalModal
                  onClose={() => setActiveModal(null)}
                  userEmail={user?.email || application?.userEmail || application?.email || ""}
                  competitionTitle={application?.competition?.title}
                />
              )}

              {activeModal === "results" && (
                <div className="space-y-4">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Results
                  </CardTitle>

                  {userResult ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted-bg">
                        <p className="text-sm">Rank: <span className="font-bold">#{userResult.rank}</span></p>
                        <p className="text-sm">Score: <span className="font-bold">{userResult.score}/10</span></p>
                        {userResult.feedback && (
                          <p className="text-sm mt-2 text-muted">{userResult.feedback}</p>
                        )}
                      </div>

                      {userResult.criteriaScores && Object.keys(userResult.criteriaScores).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Criteria breakdown</p>
                          {Object.entries(userResult.criteriaScores).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted-bg"
                            >
                              <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                              <span className="font-mono text-sm font-bold">{value}/10</span>
                            </div>
                          ))}
                        </div>
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

      <ErrorPopup
        open={errorPopup.open}
        onClose={() => setErrorPopup({ open: false, title: "", message: "" })}
        title={errorPopup.title}
        message={errorPopup.message}
      />
      <SuccessPopup
        open={successPopup.open}
        onClose={() => setSuccessPopup({ open: false, title: "", message: "" })}
        title={successPopup.title}
        message={successPopup.message}
        icon="check"
      />
    </div>
  );
}
