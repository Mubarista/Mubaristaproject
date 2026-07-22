"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Heart, Lock, MessageCircle, Send, X } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-context";
import { SectionHeading } from "@/components/shared/section-heading";
import { formatNumber } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface LatteArt {
  id: string;
  title: string;
  artist: string;
  image: string;
  likes: number;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  users: { name: string; avatar: string } | null;
}

export function FeaturedArtSection() {
  const { user } = useAuth();
  const [latteArt, setLatteArt] = useState<LatteArt[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedArt, setLikedArt] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const [selectedArtId, setSelectedArtId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const selectedArt = latteArt.find((a) => a.id === selectedArtId) || null;

  useEffect(() => {
    fetchLatteArt();
  }, []);

  useEffect(() => {
    if (!selectedArtId) {
      setComments([]);
      return;
    }
    async function fetchComments() {
      const { data, error } = await supabase
        .from("latte_art_comments")
        .select("*, users(name, avatar)")
        .eq("latte_art_id", selectedArtId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching comments:", error);
      } else {
        setComments(data || []);
      }
    }
    fetchComments();
  }, [selectedArtId]);

  async function fetchLatteArt() {
    try {
      const response = await fetch("/api/latte-art");
      if (response.ok) {
        const data = await response.json();
        setLatteArt(data);
      }
    } catch (error) {
      console.error("Error fetching latte art:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLike = async (artId: string) => {
    if (!user) {
      setNotification({ show: true, message: "Please login to like this content" });
      setTimeout(() => setNotification({ show: false, message: "" }), 3000);
      return;
    }

    const newLikedArt = new Set(likedArt);
    const updatedLatteArt = latteArt.map((art) => {
      if (art.id === artId) {
        if (newLikedArt.has(artId)) {
          newLikedArt.delete(artId);
          return { ...art, likes: art.likes - 1 };
        } else {
          newLikedArt.add(artId);
          return { ...art, likes: art.likes + 1 };
        }
      }
      return art;
    });

    setLikedArt(newLikedArt);
    setLatteArt(updatedLatteArt);

    // Update in database
    const art = updatedLatteArt.find((a) => a.id === artId);
    if (art) {
      try {
        const res = await fetch(`/api/latte-art/${artId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ likes: art.likes }),
        });
        if (!res.ok) {
          console.error("Failed to update likes:", await res.text());
          // Revert local state on failure
          setLikedArt(likedArt);
          setLatteArt(latteArt);
        }
      } catch (error) {
        console.error("Error updating likes:", error);
        // Revert local state on failure
        setLikedArt(likedArt);
        setLatteArt(latteArt);
      }
    }
  };

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedArt || !user || !commentText.trim()) return;
    setCommentLoading(true);
    const { error } = await supabase
      .from("latte_art_comments")
      .insert({ latte_art_id: selectedArt.id, user_id: user.id, comment: commentText.trim() });
    if (error) {
      console.error("Error adding comment:", error);
      setNotification({ show: true, message: "Failed to post comment. Please try again." });
      setTimeout(() => setNotification({ show: false, message: "" }), 3000);
    } else {
      setCommentText("");
      const { data } = await supabase
        .from("latte_art_comments")
        .select("*, users(name, avatar)")
        .eq("latte_art_id", selectedArt.id)
        .order("created_at", { ascending: true });
      setComments(data || []);
    }
    setCommentLoading(false);
  }

  return (
    <section className="section-padding bg-muted-bg/30">
      {/* Notification Toast */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg bg-red text-white flex items-center gap-2"
        >
          <Lock className="h-4 w-4" />
          {notification.message}
        </motion.div>
      )}

      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Gallery"
          title="Featured Latte Art"
          description="Stunning creations from our global community of talented baristas."
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        ) : (
          <div
            className="overflow-x-auto flex gap-6 pb-4 -mx-4 px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {latteArt.filter((art) => art.image && art.image.trim() !== "").map((art, i) => (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.1, 0.8) }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shrink-0 w-[85%] sm:w-[45%] lg:w-[23%] snap-start"
                onClick={() => setSelectedArtId(art.id)}
              >
                <Image
                  src={art.image}
                  alt={art.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-semibold text-white mb-1">{art.title}</h3>
                  <p className="text-sm text-white/70 mb-2">Artist Barista: {art.artist}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(art.id);
                      }}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        likedArt.has(art.id) ? "text-red-light" : "text-white/70"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 transition-all ${
                          likedArt.has(art.id) ? "fill-current scale-110" : ""
                        }`}
                      />
                      {formatNumber(art.likes)}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArtId(art.id);
                      }}
                      className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comment
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedArt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedArtId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[3/4] w-full max-h-64 overflow-hidden shrink-0">
                <Image
                  src={selectedArt.image}
                  alt={selectedArt.title}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setSelectedArtId(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="text-xl font-bold mb-1">{selectedArt.title}</h3>
                <p className="text-muted mb-4">Artist Barista: {selectedArt.artist}</p>
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => handleLike(selectedArt.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      likedArt.has(selectedArt.id) ? "text-red-light" : "text-foreground/70"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 transition-all ${
                        likedArt.has(selectedArt.id) ? "fill-current scale-110" : ""
                      }`}
                    />
                    {formatNumber(selectedArt.likes)}
                  </button>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <MessageCircle className="h-4 w-4" />
                    {comments.length} {comments.length === 1 ? "comment" : "comments"}
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue/10 flex items-center justify-center text-xs font-bold text-blue shrink-0 overflow-hidden">
                          {c.users?.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.users.avatar} alt={c.users.name} className="w-full h-full object-cover" />
                          ) : (
                            (c.users?.name || "U").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold">{c.users?.name || "Unknown"}</span>
                            <span className="text-xs text-muted">
                              {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{c.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {user ? (
                  <form onSubmit={addComment} className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      maxLength={1000}
                    />
                    <button
                      type="submit"
                      disabled={commentLoading || !commentText.trim()}
                      className="p-2 rounded-xl bg-blue text-white hover:bg-blue-dark disabled:opacity-50 transition-colors"
                    >
                      {commentLoading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-3 rounded-xl bg-muted-bg border border-white/10 text-sm text-muted">
                    Please <a href="/login" className="text-blue hover:underline">login</a> to add a comment.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
