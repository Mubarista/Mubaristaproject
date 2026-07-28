"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Heart, ShoppingBag, Check, Truck, Shield, RotateCcw, Send } from "lucide-react";
import { useAdminData } from "@/lib/admin-data-context";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getImageUrl } from "@/lib/utils";

interface Review {
  id: string;
  toolId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const defaultFeatures = [
  "Precision calibration",
  "Durable stainless steel construction",
  "Ergonomic design",
  "Easy to clean",
  "Professional grade",
];

export default function ToolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { tools } = useAdminData();
  const routeParams = useParams();
  const toolId = typeof routeParams?.id === "string" ? routeParams.id : "";
  const tool = tools.find((t) => t.id === toolId)!;
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedToWishlist, setAddedToWishlist] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pauseAutoSlide = useCallback(() => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      resumeTimeoutRef.current = null;
    }, 8000);
  }, []);

  const allImages = useMemo(() => {
    if (!tool) return [];
    return [tool.image, ...(tool.gallery?.filter(Boolean) || [])];
  }, [tool]);

  useEffect(() => {
    if (toolId) {
      setSelectedIndex(0);
      fetchReviews();
    }
  }, [toolId]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (allImages.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % allImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [allImages.length, isPaused]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
        pauseAutoSlide();
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev + 1) % allImages.length);
        pauseAutoSlide();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allImages.length, pauseAutoSlide]);

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/tool-reviews?toolId=${toolId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewLoading(false);
    }
  }

  if (tools.length === 0) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Product not found</p>
      </div>
    );
  }

  const gallery = tool.gallery?.filter(Boolean) || [];
  const mainImage = allImages[selectedIndex % allImages.length] || tool.image;
  const features = tool.features?.length ? tool.features : defaultFeatures;
  const hasDiscount = (tool.discountPrice || 0) > 0 && (tool.discountPrice || 0) < tool.price;

  const handleAddToCart = () => {
    if (!user) {
      setNotification({ show: true, message: "Please login to add items to cart", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      return;
    }
    addToCart({
      id: tool.id,
      type: "tool",
      title: tool.name,
      price: hasDiscount ? (tool.discountPrice as number) : tool.price,
      image: tool.image,
    });
    setAddedToCart(true);
    setNotification({ show: true, message: "Added to cart!", type: "success" });
    setTimeout(() => {
      setAddedToCart(false);
      setNotification({ show: false, message: "", type: "success" });
    }, 2000);
  };

  const handleAddToWishlist = () => {
    if (!user) {
      setNotification({ show: true, message: "Please login to add items to wishlist", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      return;
    }
    setAddedToWishlist(!addedToWishlist);
    setNotification({ show: true, message: addedToWishlist ? "Removed from wishlist" : "Added to wishlist", type: "success" });
    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 2000);
  };

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setNotification({ show: true, message: "Please login to leave a review", type: "error" });
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/tool-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id,
          userId: user.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewComment("");
        setReviewRating(5);
        await fetchReviews();
        setNotification({ show: true, message: "Review submitted!", type: "success" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      } else {
        setNotification({ show: true, message: "Failed to submit review", type: "error" });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setNotification({ show: true, message: "Error submitting review", type: "error" });
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
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
          <Check className="h-4 w-4" />
          {notification.message}
        </motion.div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/tools" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div
              className="relative h-96 bg-muted-bg rounded-2xl overflow-hidden"
              onClick={pauseAutoSlide}
              role="button"
              aria-label="Pause slideshow"
            >
              <Image src={getImageUrl(mainImage)} alt={tool.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => {
                const galleryUrl = gallery[i];
                const thumbIndex = galleryUrl ? i + 1 : 0;
                const img = galleryUrl || tool.image;
                const isActive = selectedIndex === thumbIndex;
                return (
                  <div
                    key={i}
                    onClick={() => { setSelectedIndex(thumbIndex); pauseAutoSlide(); }}
                    className={`relative h-24 bg-muted-bg rounded-xl overflow-hidden cursor-pointer transition-colors border-2 ${isActive ? "border-blue" : "border-transparent hover:border-blue/50"}`}
                  >
                    <Image src={getImageUrl(img)} alt={`${tool.name} view ${i + 1}`} fill sizes="100px" className="object-cover" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="blue" className="mb-3">{tool.category}</Badge>
              <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
              <p className="text-muted">{tool.brand}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.round(tool.rating || 0) ? "fill-yellow text-yellow" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{Number(tool.rating || 0).toFixed(1)}</span>
              <span className="text-sm text-muted">({tool.reviews || 0} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-bold text-green">{formatCurrency(tool.discountPrice as number)}</span>
                  <span className="text-lg text-muted line-through">{formatCurrency(tool.price)}</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-green">{formatCurrency(tool.price)}</span>
              )}
            </div>

            <p className="text-muted">{tool.description}</p>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold">Key Features</h3>
              <ul className="space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-sm text-muted mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-muted-bg hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-muted-bg hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={addedToCart}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={handleAddToWishlist}
                className={addedToWishlist ? "bg-red/10 border-red/30 text-red" : ""}
              >
                <Heart className={`h-4 w-4 ${addedToWishlist ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="text-center">
                <Truck className="h-5 w-5 text-blue mx-auto mb-2" />
                <p className="text-xs font-medium">{tool.shippingTitle || "Free Shipping"}</p>
                <p className="text-xs text-muted">{tool.shippingSubtitle || "On orders over RWF 100,000"}</p>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 text-green mx-auto mb-2" />
                <p className="text-xs font-medium">{tool.warrantyTitle || "2 Year Warranty"}</p>
                <p className="text-xs text-muted">{tool.warrantySubtitle || "Full coverage"}</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-5 w-5 text-yellow mx-auto mb-2" />
                <p className="text-xs font-medium">{tool.returnsTitle || "30 Day Returns"}</p>
                <p className="text-xs text-muted">{tool.returnsSubtitle || "Hassle-free returns"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          {user && (
            <form onSubmit={handleSubmitReview} className="glass-card rounded-2xl p-6 mb-8">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star className={`h-5 w-5 ${star <= reviewRating ? "fill-yellow text-yellow" : "text-muted"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts about this product..."
                className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue mb-4"
                rows={3}
              />
              <Button variant="primary" type="submit" disabled={submittingReview}>
                <Send className="h-4 w-4 mr-2" />
                {submittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          )}

          {reviewLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingDots />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-muted text-sm">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${star <= Math.round(review.rating || 0) ? "fill-yellow text-yellow" : "text-muted"}`} />
                    ))}
                    <span className="text-sm text-muted ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted">{review.comment || "No comment"}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.filter(t => t.id !== tool.id).slice(0, 4).map((relatedTool) => (
              <Link key={relatedTool.id} href={`/tools/${relatedTool.id}`}>
                <Card className="overflow-hidden p-0 cursor-pointer hover:border-blue/50 transition-colors">
                  <div className="relative h-40">
                    <Image src={getImageUrl(relatedTool.image)} alt={relatedTool.name} fill sizes="25vw" className="object-cover" />
                  </div>
                  <div className="p-5">
                    <Badge variant="blue" className="mb-2 text-xs">{relatedTool.category}</Badge>
                    <CardTitle className="text-base mb-1">{relatedTool.name}</CardTitle>
                    <p className="text-xs text-muted mb-2">{relatedTool.brand}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green">{formatCurrency(relatedTool.price)}</span>
                      <Button variant="primary" size="sm">View</Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
