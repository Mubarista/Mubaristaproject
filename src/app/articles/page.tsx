"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/shared/section-heading";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string;
  author: string;
  publishedDate: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    try {
      const response = await fetch("/api/articles");
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Blog"
            title="All Articles"
            description="Stay updated with tips, competition news, and barista insights."
          />
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Blog"
          title="All Articles"
          description="Stay updated with tips, competition news, and barista insights."
        />

        {articles.length === 0 ? (
          <p className="text-center text-muted py-16">No articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, i) => (
              <Link key={article.id} href={`/articles/${article.id}`} className="block">
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group glass-card rounded-2xl overflow-hidden cursor-pointer h-full"
                >
                <div className="relative h-48 overflow-hidden">
                  {article.coverImage ? (
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                      <span className="text-muted">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <span className="text-xs font-medium text-blue uppercase tracking-wider">
                    {article.category}
                  </span>
                  <h3 className="text-lg font-semibold mt-2 mb-2 group-hover:text-blue transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted mb-4">{article.excerpt}</p>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{article.author}</span>
                    <span>{article.publishedDate}</span>
                  </div>
                </div>
              </motion.article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
