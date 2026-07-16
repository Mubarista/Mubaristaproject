"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/admin/admin-modal";
import { CheckCircle, ImageIcon, Film, Upload, Trash2 } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";

interface HeroContent {
  id?: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

interface HeroBackground {
  id?: string;
  type: string;
  imageUrl: string;
  videoUrl: string;
}

interface PlatformStats {
  id?: string;
  liveCompetitions: number;
  totalParticipants: number;
  countriesJoined: number;
  totalWinners: number;
}

export default function AdminHeroPage() {
  const [hero, setHero] = useState<HeroContent>({ title: "", subtitle: "", badge: "", ctaPrimary: "", ctaSecondary: "" });
  const [stats, setStats] = useState<PlatformStats>({ liveCompetitions: 0, totalParticipants: 0, countriesJoined: 0, totalWinners: 0 });
  const [bg, setBg] = useState<HeroBackground>({ type: "image", imageUrl: "", videoUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHeroData();
  }, []);

  async function fetchHeroData() {
    try {
      const response = await fetch("/api/hero");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched data:", data);
        
        if (data.heroContent) {
          // Clean the fetched data by removing timestamp fields
          const { created_at, updated_at, ...cleanHeroContent } = data.heroContent;
          setHero(cleanHeroContent);
        }
        if (data.heroBackground) {
          const { created_at, updated_at, ...cleanHeroBackground } = data.heroBackground;
          setBg(cleanHeroBackground);
        }
        if (data.platformStats) {
          const { created_at, updated_at, ...cleanPlatformStats } = data.platformStats;
          setStats(cleanPlatformStats);
        }
      }
    } catch (error) {
      console.error("Error fetching hero data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      // Clean the data by removing id and timestamp fields before sending
      const cleanHeroContent = { ...hero };
      delete cleanHeroContent.id;
      
      const cleanHeroBackground = { ...bg };
      delete cleanHeroBackground.id;
      
      const cleanPlatformStats = { ...stats };
      delete cleanPlatformStats.id;
      
      const payload = {
        heroContent: cleanHeroContent,
        heroBackground: cleanHeroBackground,
        platformStats: cleanPlatformStats,
      };
      console.log("Saving hero data:", payload);
      
      const response = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        result = { error: "Server returned non-JSON response. Check console for details." };
      }
      console.log("Save response:", result);
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        console.error("Save failed:", result);
        alert("Failed to save: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving hero data:", error);
      alert("Error saving: " + error);
    } finally {
      setSaving(false);
    }
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setBg(b => ({ ...b, imageUrl: ev.target!.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBg(b => ({ ...b, videoUrl: url }));
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hero & Platform Stats</h1>
          <p className="text-muted text-sm">Edit the homepage hero text, background, and global platform statistics.</p>
        </div>
        <Button variant="primary" onClick={saveAll} disabled={saving}>
          {saving ? <><LoadingDots /> Saving...</> : saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : "Save All"}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingDots />
        </div>
      )}

      {!loading && (
      <>

      {/* Background Picker */}
      <Card className="mb-6">
        <CardTitle className="mb-4">Hero Background</CardTitle>

        {/* Type toggle */}
        <div className="flex gap-3 mb-5">
          <button
            type="button"
            onClick={() => setBg(b => ({ ...b, type: "image" }))}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              bg.type === "image"
                ? "bg-blue text-white border-blue"
                : "bg-muted-bg border-white/10 text-muted hover:border-blue/40"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Static Image
          </button>
          <button
            type="button"
            onClick={() => setBg(b => ({ ...b, type: "video" }))}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              bg.type === "video"
                ? "bg-blue text-white border-blue"
                : "bg-muted-bg border-white/10 text-muted hover:border-blue/40"
            }`}
          >
            <Film className="h-4 w-4" />
            Loop Video
          </button>
        </div>

        {/* Image panel */}
        {bg.type === "image" && (
          <div className="space-y-3">
            {bg.imageUrl ? (
              <div className="relative h-48 rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bg.imageUrl} alt="Hero background" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setBg(b => ({ ...b, imageUrl: "" }))}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red/80 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="h-48 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-muted-bg hover:border-blue/50 cursor-pointer transition-all"
              >
                <ImageIcon className="h-8 w-8 text-muted" />
                <p className="text-xs text-muted">Click to upload background image</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted-bg border border-white/10 text-xs hover:bg-blue/10 hover:border-blue/30 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {bg.imageUrl ? "Change image" : "Upload from device"}
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
          </div>
        )}

        {/* Video panel */}
        {bg.type === "video" && (
          <div className="space-y-3">
            {bg.videoUrl ? (
              <div className="relative h-48 rounded-xl overflow-hidden border border-white/10 bg-black">
                <video src={bg.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setBg(b => ({ ...b, videoUrl: "" }))}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red/80 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs flex items-center gap-1">
                  <Film className="h-3 w-3" /> Looping preview
                </div>
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="h-48 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-muted-bg hover:border-blue/50 cursor-pointer transition-all"
              >
                <Film className="h-8 w-8 text-muted" />
                <p className="text-xs text-muted">Click to upload loop video</p>
                <p className="text-xs text-muted/60">MP4, WEBM recommended</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted-bg border border-white/10 text-xs hover:bg-blue/10 hover:border-blue/30 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {bg.videoUrl ? "Change video" : "Upload from device"}
            </button>
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
            <p className="text-xs text-muted">Video will autoplay, loop, and be muted — with the same dark overlay as the image mode.</p>
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <CardTitle className="mb-4">Hero Section</CardTitle>
        <div className="space-y-4">
          <Field label="Live Badge Text">
            <Input value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} />
          </Field>
          <Field label="Headline">
            <Textarea value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} rows={2} />
          </Field>
          <Field label="Subtitle">
            <Textarea value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} rows={3} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary CTA Button">
              <Input value={hero.ctaPrimary} onChange={(e) => setHero({ ...hero, ctaPrimary: e.target.value })} />
            </Field>
            <Field label="Secondary CTA Button">
              <Input value={hero.ctaSecondary} onChange={(e) => setHero({ ...hero, ctaSecondary: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">Platform Stats</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Live Competitions">
            <Input
              type="number"
              value={stats.liveCompetitions}
              onChange={(e) => setStats({ ...stats, liveCompetitions: Number(e.target.value) })}
              disabled
              className="bg-muted-bg/50"
            />
            <p className="text-xs text-muted mt-1">Automatically calculated from active competitions</p>
          </Field>
          <Field label="Total Participants">
            <Input
              type="number"
              value={stats.totalParticipants}
              onChange={(e) => setStats({ ...stats, totalParticipants: Number(e.target.value) })}
            />
          </Field>
          <Field label="Countries Joined">
            <Input
              type="number"
              value={stats.countriesJoined}
              onChange={(e) => setStats({ ...stats, countriesJoined: Number(e.target.value) })}
            />
          </Field>
          <Field label="Total Winners">
            <Input
              type="number"
              value={stats.totalWinners}
              onChange={(e) => setStats({ ...stats, totalWinners: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Card>
      </>
      )}
    </div>
  );
}
