"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Upload, ArrowRight, Play } from "lucide-react";

export default function UploadVideoPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [competition, setCompetition] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCompetition() {
    try {
      const res = await fetch(`/api/competitions?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setCompetition(data);
      }
    } catch (err) {
      console.error("Error fetching competition:", err);
    }
  }

  async function fetchApplication(competitionId: string) {
    if (!user) return;
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;

    const res = await fetch(`/api/competitions/applications?userId=${user.id}`);
    if (res.ok) {
      const apps = await res.json();
      const match = apps.find((a: any) => a.competitionId === competitionId);
      setApplication(match);
    }
  }

  useEffect(() => {
    fetchCompetition();
  }, [slug]);

  useEffect(() => {
    if (competition?.id && user) {
      fetchApplication(competition.id);
    }
    if (competition || !user) {
      setLoading(false);
    }
  }, [competition, user]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!competition || !application) return;

    const maxBytes = (competition.maxVideoSize || 100) * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Video must be less than ${competition.maxVideoSize || 100}MB`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload video");

      const videoUrl = uploadData.url;
      const videoPath = uploadData.fileName || videoUrl.split("/").pop();

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const res = await fetch(`/api/competitions/applications/${application.id}/upload-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrl, videoPath }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Failed to save video");

      setSuccess(true);
      setApplication((prev: any) => ({ ...prev, videoUrl: result.videoUrl, videoPath: result.videoPath }));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
          <LoadingDots />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <p className="text-muted mb-6">You must be logged in to upload your competition video.</p>
          <Link href={`/login?returnTo=/competitions/${encodeURIComponent(slug)}/upload`}>
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <p className="text-muted">Competition not found.</p>
        </div>
      </div>
    );
  }

  if (competition.status !== "in_progress") {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{competition.title}</h1>
          <Badge>{competition.status.replace(/_/g, " ")}</Badge>
          <p className="text-muted mt-4">Video upload is not open at the moment.</p>
        </div>
      </div>
    );
  }

  if (!application || application.status !== "nominated") {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{competition.title}</h1>
          <p className="text-muted">
            {application ? "You have not been nominated yet." : "You have not applied to this competition."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-2">Upload Competition Video</h1>
        <p className="text-muted mb-6">{competition.title}</p>

        <Card className="p-6">
          <CardTitle className="mb-4">{application.fullName || application.userName}</CardTitle>
          <p className="text-sm text-muted mb-4">
            Max size: {competition.maxVideoSize || 100}MB. Max duration: {competition.maxVideoDuration || 300} seconds.
          </p>

          {application.videoUrl ? (
            <div className="mb-4">
              <p className="text-sm text-green mb-2">Your video has been uploaded.</p>
              <a href={application.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline flex items-center gap-2">
                <Play className="h-4 w-4" /> Watch your video
              </a>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block rounded-xl border-2 border-dashed border-white/10 bg-muted-bg p-8 text-center hover:border-blue/40 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted" />
                <span className="text-sm text-muted">Click to select a video file</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFile}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {uploading && <LoadingDots />}
          {error && <p className="text-red text-sm mt-3">{error}</p>}
          {success && <p className="text-green text-sm mt-3">Video uploaded successfully!</p>}

          <div className="mt-6">
            <Link href={`/competitions/${encodeURIComponent(slug)}`} className="text-blue hover:underline text-sm">
              Back to competition
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
