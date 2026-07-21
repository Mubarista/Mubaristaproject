"use client";

import { motion } from "framer-motion";
import { useAdminData } from "@/lib/admin-data-context";
import { SectionHeading } from "@/components/shared/section-heading";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { cn } from "@/lib/utils";

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function SponsorsSection() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsors();
  }, []);

  async function fetchSponsors() {
    try {
      const response = await fetch("/api/sponsors");
      if (response.ok) {
        const data = await response.json();
        setSponsors(data);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="py-14 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-center text-muted text-xs font-semibold uppercase tracking-widest mb-10">
          Trusted by Industry Leaders
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
          {sponsors.map((sponsor, i) => (
            <motion.div
              key={sponsor.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl glass-card hover:border-blue/30 transition-all cursor-default"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue/10 text-blue text-xs font-bold">
                {sponsor.logo}
              </span>
              <span className="text-sm font-semibold text-muted">{sponsor.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CoffeeFactsSection() {
  const [coffeeFacts, setCoffeeFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoffeeFacts();
  }, []);

  async function fetchCoffeeFacts() {
    try {
      const response = await fetch("/api/coffee-facts");
      if (response.ok) {
        const data = await response.json();
        setCoffeeFacts(data);
      }
    } catch (error) {
      console.error("Error fetching coffee facts:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="section-padding bg-muted-bg/30">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Did You Know?"
            title="Coffee Facts"
            description="Expand your coffee knowledge with these fascinating facts."
          />
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-muted-bg/30">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Did You Know?"
          title="Coffee Facts"
          description="Expand your coffee knowledge with these fascinating facts."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coffeeFacts.map((fact, i) => (
            <motion.div
              key={fact.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <span className="text-4xl mb-4 block">{fact.icon}</span>
              <p className="text-sm leading-relaxed">{fact.fact}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ArticlesSection() {
  const [articles, setArticles] = useState<any[]>([]);
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
      <section className="section-padding">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Blog"
            title="Latest Articles"
            description="Stay updated with tips, competition news, and barista insights."
          />
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Blog"
          title="Latest Articles"
          description="Stay updated with tips, competition news, and barista insights."
        />
        {articles.length === 0 ? (
          <p className="text-center text-muted py-16">No articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group glass-card rounded-2xl overflow-hidden"
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
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <Link href="/articles" className="text-blue hover:underline font-medium">
            Read all articles →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    fetchFAQs();
  }, []);

  async function fetchFAQs() {
    try {
      const response = await fetch("/api/faqs");
      if (response.ok) {
        const data = await response.json();
        setFaqs(data);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="section-padding bg-muted-bg/30">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            description="Everything you need to know about MUBARISTA."
          />
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-muted-bg/30">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          description="Everything you need to know about MUBARISTA."
        />
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-blue shrink-0 transition-transform",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-muted text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
