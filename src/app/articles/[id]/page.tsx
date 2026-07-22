"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  author: string;
  publishedDate: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Article not found</h1>
        <p className="text-muted mb-6">The article you&apos;re looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push("/articles")}
          className="px-4 py-2 rounded-xl bg-blue text-white hover:bg-blue-dark transition-colors"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/articles")}
          className="flex items-center gap-2 text-sm text-muted hover:text-blue transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </button>

        {article.coverImage && (
          <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden mb-8">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}

        <span className="inline-block text-xs font-medium text-blue uppercase tracking-wider mb-3">
          {article.category}
        </span>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-8 pb-8 border-b border-white/10">
          {article.author && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {article.author}
            </span>
          )}
          {article.publishedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {article.publishedDate}
            </span>
          )}
        </div>

        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
          {article.content || article.excerpt || "No content available."}
        </div>
      </div>
    </div>
  );
}
