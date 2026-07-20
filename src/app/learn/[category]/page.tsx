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
import { LoadingDots } from "@/components/ui/loading-dots";

interface Props {
  params: Promise<{ category: string }>;
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
  isPremium: boolean;
  order: number;
  active: boolean;
}

export default function LearnCategoryPage({ params }: Props) {
  const { user, isPremium } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<LearnCategory | null>(null);
  const [content, setContent] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => {
      setCategory(p.category);
      fetchCategoryAndContent(p.category);
    });
  }, [params]);

  async function fetchCategoryAndContent(categoryId: string) {
    setLoading(true);
    try {
      const [catRes, contentRes] = await Promise.all([
        fetch("/api/learn-categories"),
        fetch(`/api/learning-content?categoryId=${categoryId}`),
      ]);
      
      if (catRes.ok) {
        const categories = await catRes.json();
        const found = categories.find((c: LearnCategory) => c.id === categoryId && c.active);
        setCategoryData(found || null);
      }
      
      if (contentRes.ok) {
        const data = await contentRes.json();
        setContent(data.filter((c: LearningContent) => c.active));
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

  // If category is premium and user is not authenticated, show gate
  if (!categoryData.free && !user) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/learn" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Learning Center
          </Link>
          <PremiumGate
            title="Premium Content"
            description="Register to access this premium learning category"
          >
            <div className="space-y-4">
              {content.slice(0, 3).map((item, i) => (
                <Card key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10 text-blue font-semibold text-sm">
                      {i + 1}
                    </span>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="text-sm">{item.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="blue">{item.contentType}</Badge>
                </Card>
              ))}
            </div>
          </PremiumGate>
        </div>
      </div>
    );
  }

  // If category is premium and user is authenticated but not premium, show upgrade gate
  if (!categoryData.free && user && !isPremium) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/learn" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Learning Center
          </Link>
          <PremiumGate
            title="Premium Content"
            description="Upgrade to premium to access this learning category"
          >
            <div className="space-y-4">
              {content.slice(0, 3).map((item, i) => (
                <Card key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10 text-blue font-semibold text-sm">
                      {i + 1}
                    </span>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="text-sm">{item.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="blue">{item.contentType}</Badge>
                </Card>
              ))}
            </div>
          </PremiumGate>
        </div>
      </div>
    );
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
        <Link href="/learn" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Learning Center
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <span className="text-5xl">{categoryData.icon}</span>
          <div>
            <Badge variant={categoryData.free ? "green" : "yellow"} className="mb-2">{categoryData.free ? "Free" : "Premium"}</Badge>
            <h1 className="text-3xl font-bold">{categoryData.title}</h1>
            <p className="text-muted">{categoryData.description}</p>
          </div>
        </div>
        <div className="space-y-4">
          {content.length === 0 ? (
            <div className="text-center py-12 text-muted">
              No content available yet. Check back soon!
            </div>
          ) : (
            content.map((item) => (
              <Link key={item.id} href={`/learn/${category}/${item.id}`}>
                <Card className="flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10 text-blue">
                      {getContentIcon(item.contentType)}
                    </span>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="text-sm">{item.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isPremium && <Lock className="h-4 w-4 text-yellow" />}
                    <Badge variant="blue">{item.contentType}</Badge>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
