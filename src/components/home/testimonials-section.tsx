"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Star, Quote, Send, Lock } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-context";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";

export function TestimonialsSection() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    try {
      const res = await fetch("/api/testimonials");
      const data = await res.json();
      setTestimonials(data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }

  const allReviews = [...userReviews, ...testimonials];
  const displayedReviews = showAll ? allReviews : allReviews.slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Add user review to state
    const newReview = {
      id: `user-${Date.now()}`,
      userId: user.id,
      name: user.name,
      role: "Barista",
      country: user.country || "Rwanda",
      avatar: user.avatar || "/images/default-avatar.png",
      rating,
      quote: comment,
      isUserReview: true,
    };
    setUserReviews([newReview, ...userReviews]);
    setSubmitted(true);
    setComment("");
    setRating(0);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 3000);
  };

  return (
    <section className="section-padding">
      {/* Notification Toast */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
            notification.type === "success" ? "bg-green text-white" : "bg-red text-white"
          }`}
        >
          <Star className="h-4 w-4" />
          {notification.message}
        </motion.div>
      )}

      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Community"
          title="What Baristas Say"
          description="Real stories from baristas who transformed their careers with MUBARISTA."
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {displayedReviews.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`glass-card rounded-2xl p-8 relative ${t.isUserReview && user?.id === t.userId ? "border-2 border-blue/30" : ""}`}
            >
              <Quote className="h-8 w-8 text-blue/30 absolute top-6 right-6" />
              {t.isUserReview && user?.id === t.userId && (
                <div className="mb-4">
                  <span className="text-xs bg-blue/10 text-blue px-2 py-1 rounded-full">Your Review</span>
                </div>
              )}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow text-yellow" />
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  {t.avatar ? (
                    <Image src={t.avatar} alt={t.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                      <span className="text-muted text-xs">{t.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted">
                    {t.role} · {t.country}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {allReviews.length > 3 && (
          <div className="text-center mb-12">
            <Button
              variant="secondary"
              onClick={() => setShowAll(!showAll)}
              className="mx-auto"
            >
              {showAll ? "Show Less" : `View All Reviews (${allReviews.length})`}
            </Button>
          </div>
        )}

        {/* Add Your Review Section */}
        <div className="glass-card rounded-2xl p-8">
          {!showForm ? (
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Share Your Experience</h3>
              <p className="text-muted mb-6">Tell us how MUBARISTAHUB has helped your barista journey</p>
              <Button
                variant="primary"
                onClick={() => {
                  if (!user) {
                    setNotification({ show: true, message: "Please login to share your experience", type: "error" });
                    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
                    return;
                  }
                  setShowForm(true);
                }}
                className="flex items-center gap-2 mx-auto"
              >
                {user ? <Send className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {user ? "Write a Review" : "Login to Write a Review"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold mb-6">Write Your Review</h3>

              <div className="mb-6">
                <label className="text-sm text-muted mb-2 block">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 flex-shrink-0"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating ? "fill-yellow text-yellow" : "text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm text-muted mb-2 block">Your Experience</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your story with MUBARISTA..."
                  rows={4}
                  required
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                />
              </div>

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-green/10 border border-green/30 rounded-xl text-green text-sm text-center"
                >
                  Thank you for sharing your experience!
                </motion.div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" className="flex-1" disabled={submitted}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitted ? "Submitted" : "Submit Review"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
