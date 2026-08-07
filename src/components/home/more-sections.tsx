"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  const [selectedFact, setSelectedFact] = useState<any | null>(null);
  const [viewedFacts, setViewedFacts] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

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

  const handleFactClick = (fact: any) => {
    setSelectedFact(fact);
    setViewedFacts((prev) => new Set([...prev, fact.id]));
    
    // Auto-advance to next fact after viewing
    if (coffeeFacts.length > 0) {
      const nextIndex = (currentIndex + 1) % coffeeFacts.length;
      setTimeout(() => {
        setDirection(1);
        setCurrentIndex(nextIndex);
      }, 300);
    }
  };

  const goToNext = () => {
    if (coffeeFacts.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % coffeeFacts.length);
  };

  const goToPrev = () => {
    if (coffeeFacts.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + coffeeFacts.length) % coffeeFacts.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

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

  const currentFact = coffeeFacts[currentIndex];

  return (
    <section className="section-padding bg-gradient-to-b from-muted-bg/30 via-background to-muted-bg/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-64 h-64 bg-yellow/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-80 h-80 bg-blue/10 rounded-full blur-3xl"
        />
      </div>

      <div className="mx-auto max-w-4xl relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            eyebrow="Did You Know?"
            title="Coffee Facts"
            description="Swipe or click to explore fascinating coffee facts. Each fact reveals more when you interact with it."
          />
        </motion.div>

        {/* Progress indicator */}
        {coffeeFacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow/10 to-blue/10 border border-white/10">
              <span className="text-sm text-muted">Explored:</span>
              <span className="font-bold text-foreground">
                {viewedFacts.size}/{coffeeFacts.length}
              </span>
              <div className="w-24 h-2 bg-muted-bg rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow to-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${(viewedFacts.size / coffeeFacts.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Carousel container */}
        <div className="relative">
          {/* Navigation arrows */}
          {coffeeFacts.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 w-12 h-12 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Previous fact"
              >
                <span className="text-2xl">←</span>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 w-12 h-12 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Next fact"
              >
                <span className="text-2xl">→</span>
              </button>
            </>
          )}

          {/* Carousel slide */}
          <div
            className="relative min-h-[400px] flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <AnimatePresence mode="wait" custom={direction}>
              {currentFact && (
                <motion.div
                  key={currentFact.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 300, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: direction * -300, scale: 0.9 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="w-full max-w-2xl"
                >
                  <div
                    onClick={() => handleFactClick(currentFact)}
                    className="group cursor-pointer relative"
                  >
                    {/* Animated gradient border */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow via-blue to-yellow rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    
                    <div className="relative glass-card rounded-2xl p-8 md:p-12 overflow-hidden">
                      {/* Shimmer effect on hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                      />

                      {/* Floating icon with animation */}
                      <motion.div
                        className="relative mb-6 flex justify-center"
                        animate={{
                          y: [0, -8, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow/20 to-blue/20 group-hover:from-yellow/30 group-hover:to-blue/30 transition-all duration-300">
                          <motion.span 
                            className="text-6xl"
                            whileHover={{ 
                              rotate: [0, -10, 10, -10, 0],
                              scale: 1.2,
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            {currentFact.icon}
                          </motion.span>
                        </div>
                      </motion.div>

                      {/* Fact text */}
                      <p className="text-lg md:text-xl leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors duration-300 mb-6 text-center">
                        {currentFact.fact}
                      </p>

                      {/* Click indicator */}
                      <div className="flex items-center justify-center gap-4 text-sm text-muted">
                        <span className="flex items-center gap-2">
                          <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            👆
                          </motion.span>
                          Tap to explore more
                        </span>
                        {viewedFacts.has(currentFact.id) && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 text-green"
                          >
                            <span className="w-2 h-2 bg-green rounded-full" />
                            Viewed
                          </motion.span>
                        )}
                      </div>

                      {/* Corner accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation dots */}
          {coffeeFacts.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {coffeeFacts.map((fact, index) => (
                <button
                  key={fact.id}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    index === currentIndex
                      ? "bg-gradient-to-r from-yellow to-blue w-8"
                      : viewedFacts.has(fact.id)
                      ? "bg-green/50 hover:bg-green"
                      : "bg-muted hover:bg-muted/80"
                  )}
                  aria-label={`Go to fact ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Swipe hint for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="md:hidden text-center mt-6 text-sm text-muted"
          >
            <motion.span
              animate={{ x: [-10, 10, -10] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ← Swipe to explore →
            </motion.span>
          </motion.div>
        </div>

        {/* Fun fact callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow/10 via-blue/10 to-yellow/10 border border-white/10">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              ☕
            </motion.span>
            <span className="text-sm text-muted">
              <span className="font-semibold text-foreground">{coffeeFacts.length}</span> fascinating facts to discover
            </span>
          </div>
        </motion.div>
      </div>

      {/* Expanded fact modal */}
      <AnimatePresence>
        {selectedFact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFact(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full"
            >
              {/* Animated gradient border */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow via-blue to-yellow rounded-3xl opacity-75 blur animate-gradient-rotate" />
              
              <div className="relative glass-card rounded-3xl p-8 overflow-hidden">
                {/* Close button */}
                <button
                  onClick={() => setSelectedFact(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted-bg/50 hover:bg-muted-bg flex items-center justify-center transition-colors z-10"
                >
                  <span className="text-xl">×</span>
                </button>

                {/* Icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow/30 to-blue/30 flex items-center justify-center"
                    >
                      <span className="text-6xl">{selectedFact.icon}</span>
                    </motion.div>
                    
                    {/* Sparkles */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow rounded-full"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow to-blue bg-clip-text text-transparent">
                    Did You Know?
                  </h3>
                  <p className="text-lg leading-relaxed text-foreground/90 mb-6">
                    {selectedFact.fact}
                  </p>

                  {/* Fun stats */}
                  <div className="flex items-center justify-center gap-6 text-sm text-muted">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow">★</span>
                      <span>Coffee Fact</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <span className="text-blue">ℹ</span>
                      <span>Expand your knowledge</span>
                    </div>
                  </div>
                </motion.div>

                {/* Action button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex justify-center"
                >
                  <button
                    onClick={() => setSelectedFact(null)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow to-blue text-white font-semibold hover:shadow-lg hover:shadow-yellow/25 transition-all duration-300 hover:scale-105"
                  >
                    Explore More Facts
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block"
              >
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
