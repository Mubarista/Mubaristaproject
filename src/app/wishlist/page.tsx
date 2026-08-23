"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, BookOpen, Wrench, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAdminData } from "@/lib/admin-data-context";
import { useCart } from "@/lib/cart-context";
import { getWishlist, removeWishlistItem, type WishlistRow } from "@/lib/wishlist";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";
import { getImageUrl } from "@/lib/utils";

interface WishlistItem {
  id: string;
  type: "book" | "tool";
  title: string;
  author?: string;
  price: number;
  image: string | null;
  inStock: boolean;
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { books, tools } = useAdminData();
  const { addToCart } = useCart();

  const [wishlistRows, setWishlistRows] = useState<WishlistRow[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  async function loadWishlist() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const rows = await getWishlist();
    setWishlistRows(rows);

    const mapped = rows
      .map((row) => {
        if (row.item_type === "book") {
          const book = books.find((b) => b.id === row.item_id);
          if (!book) return null;
          return {
            id: book.id,
            type: "book" as const,
            title: book.title,
            author: book.author || undefined,
            price: Number(book.price) || 0,
            image: (book.cover as string | null) || null,
            inStock: true,
          };
        }
        if (row.item_type === "tool") {
          const tool = tools.find((t) => t.id === row.item_id);
          if (!tool) return null;
          return {
            id: tool.id,
            type: "tool" as const,
            title: tool.name,
            price: Number(tool.price) || 0,
            image: (tool.image as string | null) || null,
            inStock: tool.stock === null || tool.stock === undefined || (tool.stock ?? 0) > 0,
          };
        }
        return null;
      })
      .filter(Boolean) as WishlistItem[];

    const items: WishlistItem[] = mapped;

    setWishlistItems(items);
    setLoading(false);
  }

  useEffect(() => {
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, books, tools]);

  const removeItem = async (item: WishlistItem) => {
    const result = await removeWishlistItem(item.id, item.type);
    if (result.success) {
      setWishlistItems((items) => items.filter((i) => i.id !== item.id || i.type !== item.type));
      setNotification({ show: true, message: "Removed from wishlist" });
    } else {
      setNotification({ show: true, message: result.message || "Failed to remove" });
    }
    setTimeout(() => setNotification({ show: false, message: "" }), 2000);
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (item.type === "book") {
      addToCart({
        id: item.id,
        type: "book",
        title: item.title,
        author: item.author,
        price: item.price,
        image: item.image || "",
      });
    } else {
      addToCart({
        id: item.id,
        type: "tool",
        title: item.title,
        price: item.price,
        image: item.image || "",
      });
    }
    setNotification({ show: true, message: "Added to cart!" });
    setTimeout(() => setNotification({ show: false, message: "" }), 2000);
  };

  if (!user) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center p-8">
          <Heart className="h-16 w-16 text-muted mx-auto mb-4" />
          <CardTitle className="mb-2">Sign in to view your wishlist</CardTitle>
          <p className="text-muted mb-6">Your saved items are waiting for you.</p>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
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

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <LoadingDots />
          </div>
        ) : wishlistItems.length === 0 ? (
          <Card className="text-center py-16">
            <Heart className="h-16 w-16 text-muted mx-auto mb-4" />
            <CardTitle className="mb-2">Your wishlist is empty</CardTitle>
            <p className="text-muted mb-6">Save items you want to buy later</p>
            <Link href="/books">
              <Button variant="primary">Browse E-Books</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item, index) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <Link href={item.type === "book" ? `/books/${item.id}` : `/tools/${item.id}`}>
                    <div className="h-48 bg-muted-bg flex items-center justify-center relative">
                      {item.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getImageUrl(item.image) || item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : item.type === "book" ? (
                        <BookOpen className="h-12 w-12 text-muted" />
                      ) : (
                        <Wrench className="h-12 w-12 text-muted" />
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeItem(item);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Badge variant="blue" className="mb-2 text-xs capitalize">{item.type}</Badge>
                    <h3 className="font-medium mb-1 line-clamp-2">{item.title}</h3>
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
