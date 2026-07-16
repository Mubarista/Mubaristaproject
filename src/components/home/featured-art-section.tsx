"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, Lock } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth } from "@/lib/auth-context";
import { SectionHeading } from "@/components/shared/section-heading";
import { formatNumber } from "@/lib/utils";

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

export function FeaturedArtSection() {
  const { user } = useAuth();
  const [latteArt, setLatteArt] = useState<LatteArt[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedArt, setLikedArt] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  useEffect(() => {
    fetchLatteArt();
  }, []);

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
    const updatedLatteArt = latteArt.map(art => {
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
    const art = updatedLatteArt.find(a => a.id === artId);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latteArt.filter(art => art.image && art.image.trim() !== "").map((art, i) => (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
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
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
