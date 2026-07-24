"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Play, Image as ImageIcon, FileText } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { PremiumGate } from "@/components/shared/premium-gate";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Props {
  params: Promise<{ category: string; content: string }>;
}

interface LearnCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  free: boolean;
  active: boolean;
  order: number;
}

interface LearningContent {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  contentType: string;
  mediaUrl: string | null;
  textContent: string | null;
  images: { url: string; caption?: string }[] | null;
  isPremium: boolean;
  order: number;
  active: boolean;
}

export default function LearnContentPage({ params }: Props) {
  const { user, isPremium } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<LearnCategory | null>(null);
  const [content, setContent] = useState<LearningContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => {
      setCategory(p.category);
      fetchCategoryAndContent(p.category, p.content);
    });
  }, [params]);

  async function fetchCategoryAndContent(categoryId: string, contentId: string) {
    setLoading(true);
    try {
      const [catRes, contentRes] = await Promise.all([
        fetch("/api/learn-categories"),
        fetch("/api/learning-content"),
      ]);
      
      if (catRes.ok) {
        const categories = await catRes.json();
        const found = categories.find((c: LearnCategory) => c.id === categoryId && c.active);
        setCategoryData(found || null);
      }
      
      if (contentRes.ok) {
        const data = await contentRes.json();
        const found = data.find((c: LearningContent) => c.id === contentId && c.active);
        setContent(found || null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="flex items-center justify-center py-12">
          <LoadingDots />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/learn" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Learning Center
          </Link>
          <div className="glass-card rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Registration Required</h2>
            <p className="text-muted mb-6">Log in or register to access learning content.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button variant="secondary">Log In</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary">Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!categoryData) return notFound();
  if (!content) return notFound();

  // Check if content is premium and user doesn't have access
  if (content.isPremium && !isPremium) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href={`/learn/${category}`} className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to {categoryData.title}
          </Link>
          <PremiumGate
            title="Premium Content"
            description="Upgrade to premium to access this learning content"
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{categoryData.icon}</span>
                <div>
                  <CardTitle className="text-xl">{content.title}</CardTitle>
                  <CardDescription>{content.description}</CardDescription>
                </div>
              </div>
              <Badge variant="premium">{content.contentType}</Badge>
            </Card>
          </PremiumGate>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (content.contentType) {
      case "video":
        if (content.mediaUrl) {
          // Check if it's a YouTube URL
          const youtubeMatch = content.mediaUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (youtubeMatch) {
            const videoId = youtubeMatch[1];
            return (
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={content.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
          // Regular video URL
          return (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl group">
              <video
                controls
                className="w-full h-full object-contain"
                src={content.mediaUrl}
                controlsList="nodownload"
                playsInline
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-4 pb-12 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <h2 className="text-white font-semibold text-lg drop-shadow-sm">{content.title}</h2>
                {content.description && (
                  <p className="text-white/80 text-sm truncate drop-shadow-sm">{content.description}</p>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="aspect-video bg-muted-bg rounded-xl flex items-center justify-center">
            <p className="text-muted">No video URL provided</p>
          </div>
        );

      case "image": {
        const imageItems = content.images?.filter((img) => img.url) || [];
        if (imageItems.length === 0 && content.mediaUrl) {
          imageItems.push({ url: content.mediaUrl });
        }
        if (imageItems.length > 0) {
          return (
            <ImageCarousel
              images={imageItems}
              alt={content.title}
              className="max-w-2xl mx-auto"
              aspectRatio="16/9"
            />
          );
        }
        return (
          <div className="aspect-video bg-muted-bg rounded-xl flex items-center justify-center">
            <p className="text-muted">No images provided</p>
          </div>
        );
      }

      case "text":
        return (
          <Card className="p-8">
            <div className="prose prose-invert max-w-none">
              {content.textContent ? (
                <div className="whitespace-pre-wrap">{content.textContent}</div>
              ) : (
                <p className="text-muted">No text content provided</p>
              )}
            </div>
          </Card>
        );

      default:
        return (
          <Card className="p-8">
            <p className="text-muted">Unknown content type</p>
          </Card>
        );
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video": return <Play className="h-5 w-5" />;
      case "image": return <ImageIcon className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link href={`/learn/${category}`} className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to {categoryData.title}
        </Link>
        
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10 text-blue">
              {getContentIcon(content.contentType)}
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{content.title}</h1>
              {content.isPremium && <Lock className="h-5 w-5 text-yellow" />}
            </div>
          </div>
          <p className="text-muted">{content.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="blue">{content.contentType}</Badge>
            {content.isPremium && <Badge variant="premium">Premium</Badge>}
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
