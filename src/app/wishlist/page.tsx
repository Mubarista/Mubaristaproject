"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, BookOpen, Wrench, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WishlistItem {
  id: string;
  type: "book" | "tool";
  title: string;
  author?: string;
  price: number;
  image: string;
  inStock: boolean;
}

export default function WishlistPage() {
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    {
      id: "1",
      type: "book",
      title: "The Art of Espresso",
      author: "James Hoffman",
      price: 29,
      image: "/images/book1.jpg",
      inStock: true,
    },
    {
      id: "2",
      type: "tool",
      title: "La Marzocco Tamper",
      price: 89,
      image: "/images/tool1.jpg",
      inStock: true,
    },
    {
      id: "3",
      type: "book",
      title: "World Barista Championship Guide",
      author: "Various Authors",
      price: 45,
      image: "/images/book2.jpg",
      inStock: false,
    },
    {
      id: "4",
      type: "tool",
      title: "Precision Scale",
      price: 120,
      image: "/images/tool2.jpg",
      inStock: true,
    },
  ]);
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const removeItem = (id: string) => {
    setWishlistItems(items => items.filter(item => item.id !== id));
  };

  const handleAddToCart = (item: WishlistItem) => {
    addToCart({
      id: item.id,
      type: item.type,
      title: item.title,
      author: item.author,
      price: item.price,
      image: item.image,
    });
    setNotification({ show: true, message: "Added to cart!" });
    setTimeout(() => setNotification({ show: false, message: "" }), 2000);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      {/* Notification Toast */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 right-4 z-50 bg-green text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          {notification.message}
        </motion.div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wishlist</h1>
          <p className="text-muted">{wishlistItems.length} items saved</p>
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="text-center py-16">
            <Heart className="h-16 w-16 text-muted mx-auto mb-4" />
            <CardTitle className="mb-2">Your wishlist is empty</CardTitle>
            <p className="text-muted mb-6">Save items you want to buy later</p>
            <Link href="/books">
              <Button variant="primary">Browse Books</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className="h-48 bg-muted-bg flex items-center justify-center relative">
                    {item.type === "book" ? (
                      <BookOpen className="h-12 w-12 text-muted" />
                    ) : (
                      <Wrench className="h-12 w-12 text-muted" />
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <Badge variant="blue" className="mb-2 text-xs capitalize">{item.type}</Badge>
                    <h3 className="font-medium mb-1">{item.title}</h3>
                    {item.author && <p className="text-sm text-muted mb-2">{item.author}</p>}
                    <div className="flex items-center justify-between">
                      <p className="font-bold">RWF {item.price}</p>
                      <Badge variant={item.inStock ? "green" : "red"} className="text-xs">
                        {item.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full mt-3"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.inStock}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {item.inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
