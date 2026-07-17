"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/admin/admin-modal";
import { CheckCircle, ImageIcon, Film, Upload, Trash2, Crop as CropIcon, X } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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

const HERO_ASPECT = 16 / 9;

function getCroppedCanvas(image: HTMLImageElement, crop: PixelCrop): CanvasRenderingContext2D | null {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return ctx;
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

  // Preview state: use a blob URL for the admin preview to avoid Supabase img quirks
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  // Keep ref in sync with state so cleanup can always revoke the latest URL
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // Crop state
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    fetchHeroData();
  }, []);

  function setPreviewUrlSafe(url: string | null) {
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });
  }

  async function fetchHeroData() {
    try {
      console.log("[Hero Admin] Fetching hero data...");
      const response = await fetch("/api/hero");
      if (response.ok) {
        const data = await response.json();
        console.log("[Hero Admin] Received hero data:", data);
        if (data.heroContent) {
          const { created_at, updated_at, ...cleanHeroContent } = data.heroContent;
          setHero(cleanHeroContent);
        }
        if (data.heroBackground) {
          const { created_at, updated_at, ...cleanHeroBackground } = data.heroBackground;
          console.log("[Hero Admin] Setting background:", cleanHeroBackground);
          setBg(cleanHeroBackground);
          // Refresh preview from remote URL
          await refreshPreview(cleanHeroBackground.imageUrl);
        } else {
          console.log("[Hero Admin] No hero background in response");
          setPreviewUrlSafe(null);
        }
        if (data.platformStats) {
          const { created_at, updated_at, ...cleanPlatformStats } = data.platformStats;
          setStats(cleanPlatformStats);
        }
      } else {
        console.error("[Hero Admin] Failed to fetch hero data:", response.status);
      }
    } catch (error) {
      console.error("[Hero Admin] Error fetching hero data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
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
      console.log("[Hero Admin] Saving payload:", payload);
      const response = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = { error: "Server returned non-JSON response." };
      }
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert("Failed to save: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving hero data:", error);
      alert("Error saving: " + error);
    } finally {
      setSaving(false);
    }
  }

  // When user selects an image, load it into cropper
  function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      // Set default centered crop with 16:9 aspect
      setCrop({ unit: "%", width: 90, height: 50, x: 5, y: 25 });
      // Show modal with a small delay for smooth transition
      setTimeout(() => setShowCropModal(true), 50);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    imgRef.current = e.currentTarget;
  }

  // Crop and upload
  const handleCropAndUpload = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;
    const ctx = getCroppedCanvas(imgRef.current, completedCrop);
    if (!ctx) return;
    const canvas = ctx.canvas;
    setUploading(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
      );
      if (!blob) {
        alert("Failed to process image.");
        return;
      }
      const formData = new FormData();
      const file = new File([blob], "hero-bg.jpg", { type: "image/jpeg" });
      formData.append("file", file);
      formData.append("type", "photo");
      formData.append("maxWidth", "1920");
      formData.append("maxHeight", "1080");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (response.ok) {
        const data = await response.json();
        console.log("[Hero Admin] Upload response:", data);
        if (!data.url) {
          console.error("[Hero Admin] Upload response missing URL:", data);
          alert("Upload succeeded but no URL was returned.");
          return;
        }
        setBg((b) => ({ ...b, type: "image", imageUrl: data.url, videoUrl: "" }));
        // Show the cropped image immediately while the remote fetch happens
        const localPreview = URL.createObjectURL(file);
        setPreviewUrlSafe(localPreview);
        // Then replace with a fresh blob from the uploaded URL
        await refreshPreview(data.url);
        // Close modal smoothly
        setShowCropModal(false);
        setTimeout(() => {
          setRawImageSrc(null);
          setCrop(undefined);
          setCompletedCrop(undefined);
        }, 200);
        console.log("[Hero Admin] Image uploaded. Remember to click Save All to persist.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Hero Admin] Upload failed:", response.status, errorData);
        alert("Failed to upload cropped image: " + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error("Crop upload error:", error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }, [completedCrop]);

  function cancelCrop() {
    setShowCropModal(false);
    // Wait for transition to complete before clearing state
    setTimeout(() => {
      setRawImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }, 200);
  }

  // Fetch a remote image and display it as a local blob URL. This avoids
  // referrer/CORS/cache issues that can break <img src={supabaseUrl}>.
  async function refreshPreview(url: string) {
    console.log("[Hero Admin] Refreshing preview for URL:", url);
    if (!url) {
      setPreviewUrlSafe(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(url, { mode: "cors", cache: "no-cache" });
      console.log("[Hero Admin] Preview fetch status:", res.status, "content-type:", res.headers.get("content-type"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      console.log("[Hero Admin] Fetched blob:", blob.type, blob.size);
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrlSafe(objectUrl);
      console.log("[Hero Admin] Preview loaded via blob URL:", objectUrl);
    } catch (error) {
      console.error("[Hero Admin] Failed to load preview blob:", error);
      // Fall back to the raw URL so the user still sees something if the
      // browser can render it directly.
      setPreviewUrlSafe(url);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (response.ok) {
        const data = await response.json();
        setBg((b) => ({ ...b, type: "video", videoUrl: data.url, imageUrl: "" }));
      } else {
        alert("Failed to upload video. Please try a smaller file.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload video.");
    } finally {
      setSaving(false);
    }
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
                onClick={() => setBg((b) => ({ ...b, type: "image" }))}
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
                onClick={() => setBg((b) => ({ ...b, type: "video" }))}
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
                {/* Cropper Modal */}
                {rawImageSrc && (
                  <div 
                    className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
                      showCropModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className={`bg-card rounded-2xl p-6 max-w-2xl w-full transition-all duration-200 ${
                      showCropModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2">
                          <CropIcon className="h-5 w-5" /> Crop Hero Image
                        </h3>
                        <button onClick={cancelCrop} className="p-1.5 rounded-lg hover:bg-white/10">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mb-4 max-h-[50vh] overflow-auto rounded-xl bg-black/30">
                        <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => setCrop(percentCrop)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={HERO_ASPECT}
                          minWidth={20}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={rawImageSrc}
                            onLoad={onImageLoad}
                            alt="Crop preview"
                            style={{ maxHeight: "40vh" }}
                          />
                        </ReactCrop>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="ghost" size="sm" onClick={cancelCrop}>Cancel</Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleCropAndUpload}
                          disabled={!completedCrop || uploading}
                        >
                          {uploading ? <><LoadingDots /> Uploading...</> : <><CropIcon className="h-4 w-4" /> Crop & Upload</>}
                        </Button>
                      </div>
                      <p className="text-xs text-muted mt-2">
                        Drag to adjust the crop area. The image will be scaled to 1920×1080 max after cropping.
                      </p>
                    </div>
                  </div>
                )}

                {/* Current image display */}
                {previewUrl || bg.imageUrl ? (
                  <div className="relative h-48 rounded-xl overflow-hidden border border-white/10 bg-muted-bg">
                    {previewLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                        <LoadingDots />
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl || bg.imageUrl}
                      alt="Hero background"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      // Only use crossOrigin for remote URLs, not blob URLs
                      crossOrigin={previewUrl?.startsWith("blob:") ? undefined : "anonymous"}
                      onLoad={() => {
                        console.log("[Hero Admin] Image rendered successfully:", previewUrl || bg.imageUrl);
                        setPreviewLoading(false);
                      }}
                      onError={(e) => {
                        console.error("[Hero Admin] Image failed to render:", previewUrl || bg.imageUrl, e);
                        setPreviewLoading(false);
                        // If the direct URL fails, try fetching as blob and replacing src
                        if (bg.imageUrl && !previewUrl) {
                          refreshPreview(bg.imageUrl);
                        }
                      }}
                    />
                    {previewUrl && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs">
                        Preview
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBg((b) => ({ ...b, imageUrl: "" }));
                        setPreviewUrlSafe(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red/80 transition-colors z-20"
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
                    <p className="text-xs text-muted/60">You can crop before saving</p>
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
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileSelect} />
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
                      onClick={() => setBg((b) => ({ ...b, videoUrl: "" }))}
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