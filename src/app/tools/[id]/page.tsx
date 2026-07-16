"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Heart, ShoppingBag, Check, Truck, Shield, RotateCcw } from "lucide-react";
import { useAdminData } from "@/lib/admin-data-context";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default function ToolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { tools } = useAdminData();
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

  // In a real app, you'd fetch the specific tool by ID
  // For now, we'll use the first tool as a placeholder
  const tool = tools[0];

  if (!tool) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Product not found</p>
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
      id: tool.id,
      type: "tool",
      title: tool.name,
      price: tool.price,
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
            <div className="relative h-96 bg-muted-bg rounded-2xl overflow-hidden">
              {tool.image ? (
                <Image src={tool.image} alt={tool.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted">
                  No image available
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative h-24 bg-muted-bg rounded-xl overflow-hidden cursor-pointer hover:border-blue/50 transition-colors border border-transparent">
                  {tool.image ? (
                    <Image src={tool.image} alt={`${tool.name} view ${i}`} fill sizes="100px" className="object-cover" />
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
              <Badge variant="blue" className="mb-3">{tool.category}</Badge>
              <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
              <p className="text-muted">{tool.brand}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.floor(tool.rating) ? "fill-yellow text-yellow" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{tool.rating}</span>
              <span className="text-sm text-muted">({Math.floor(Math.random() * 100) + 10} reviews)</span>
            </div>

            <div className="text-3xl font-bold text-green">{formatCurrency(tool.price)}</div>

            <p className="text-muted">
              Professional-grade equipment designed for competition-level baristas. Precision engineering meets durability in this essential tool for your coffee preparation workflow.
            </p>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold">Key Features</h3>
              <ul className="space-y-2">
                {["Precision calibration", "Durable stainless steel construction", "Ergonomic design", "Easy to clean", "Professional grade"].map((feature) => (
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
                <p className="text-xs font-medium">{siteSettings?.shippingInfo1Title || "Free Shipping"}</p>
                <p className="text-xs text-muted">{siteSettings?.shippingInfo1Description || "On orders over RWF 100,000"}</p>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 text-green mx-auto mb-2" />
                <p className="text-xs font-medium">{siteSettings?.shippingInfo2Title || "2 Year Warranty"}</p>
                <p className="text-xs text-muted">{siteSettings?.shippingInfo2Description || "Full coverage"}</p>
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
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.slice(0, 4).map((relatedTool) => (
              <Link key={relatedTool.id} href={`/tools/${relatedTool.id}`}>
                <Card className="overflow-hidden p-0 cursor-pointer hover:border-blue/50 transition-colors">
                  <div className="relative h-40">
                    {relatedTool.image ? (
                      <Image src={relatedTool.image} alt={relatedTool.name} fill sizes="25vw" className="object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted-bg flex items-center justify-center text-muted text-xs">No image</div>
                    )}
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
