"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Heart, ShoppingBag, Check, Truck, Shield, RotateCcw, BookOpen } from "lucide-react";
import { useAdminData } from "@/lib/admin-data-context";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { books } = useAdminData();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedToWishlist, setAddedToWishlist] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  async function fetchSiteSettings() {
    try {
      const res = await fetch("/api/site-settings");
      const data = await res.json();
      setSiteSettings(data);
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  }

  // In a real app, you'd fetch the specific book by ID
  // For now, we'll use the first book as a placeholder
  const book = books[0];

  if (!book) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Book not found</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      setNotification({ show: true, message: "Please login to add items to cart", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      return;
    }
    addToCart({
      id: book.id,
      type: "book",
      title: book.title,
      author: book.author,
      price: book.price,
      image: book.cover,
    });
    setAddedToCart(true);
    setNotification({ show: true, message: "Added to cart!", type: "success" });
    setTimeout(() => {
      setAddedToCart(false);
      setNotification({ show: false, message: "", type: "success" });
    }, 2000);
  };

  const handlePurchaseNow = () => {
    if (!user) {
      setNotification({ show: true, message: "Please login to purchase", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      return;
    }
    addToCart({
      id: book.id,
      type: "book",
      title: book.title,
      author: book.author,
      price: book.price,
      image: book.cover,
    });
    window.location.href = "/checkout";
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
        <Link href="/books" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Books
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative h-96 bg-muted-bg rounded-2xl overflow-hidden">
              {book.cover ? (
                <Image src={book.cover} alt={book.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted">
                  No cover available
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative h-24 bg-muted-bg rounded-xl overflow-hidden cursor-pointer hover:border-blue/50 transition-colors border border-transparent">
                  {book.cover ? (
                    <Image src={book.cover} alt={`${book.title} view ${i}`} fill sizes="100px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted text-xs">
                      View {i}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="default" className="mb-3">{book.category}</Badge>
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              <p className="text-muted">by {book.author}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.floor(book.rating) ? "fill-yellow text-yellow" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{book.rating}</span>
              <span className="text-sm text-muted">({book.reviews} reviews)</span>
            </div>

            <div className="text-3xl font-bold text-green">{formatCurrency(book.price)}</div>

            <p className="text-muted">{book.description}</p>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold">Book Details</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-blue" />
                  {book.category}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green" />
                  Professional barista guide
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green" />
                  Expert techniques and recipes
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green" />
                  High-quality print
                </li>
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
                onClick={handlePurchaseNow}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Purchase Now
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={addedToCart}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Added
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
                <p className="text-xs font-medium">{siteSettings?.shippingInfo1Title || "Free Shipping"}</p>
                <p className="text-xs text-muted">{siteSettings?.shippingInfo1Description || "On orders over RWF 100,000"}</p>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 text-green mx-auto mb-2" />
                <p className="text-xs font-medium">{siteSettings?.shippingInfo2Title || "Secure Payment"}</p>
                <p className="text-xs text-muted">{siteSettings?.shippingInfo2Description || "Protected checkout"}</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-5 w-5 text-yellow mx-auto mb-2" />
                <p className="text-xs font-medium">{siteSettings?.shippingInfo3Title || "30 Day Returns"}</p>
                <p className="text-xs text-muted">{siteSettings?.shippingInfo3Description || "Hassle-free returns"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.slice(0, 4).map((relatedBook) => (
              <Link key={relatedBook.id} href={`/books/${relatedBook.id}`}>
                <Card className="overflow-hidden p-0 cursor-pointer hover:border-blue/50 transition-colors">
                  <div className="relative h-56">
                    {relatedBook.cover ? (
                      <Image src={relatedBook.cover} alt={relatedBook.title} fill sizes="25vw" className="object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted-bg flex items-center justify-center text-muted text-xs">No image</div>
                    )}
                  </div>
                  <div className="p-6">
                    <Badge variant="default" className="mb-2">{relatedBook.category}</Badge>
                    <CardTitle className="text-lg mb-1">{relatedBook.title}</CardTitle>
                    <p className="text-sm text-muted mb-3">by {relatedBook.author}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-4 w-4 fill-yellow text-yellow" />
                      <span className="text-sm font-medium">{relatedBook.rating}</span>
                      <span className="text-sm text-muted">({relatedBook.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green">{formatCurrency(relatedBook.price)}</span>
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
