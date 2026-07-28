"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, BookOpen, Wrench } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const [settings, setSettings] = useState<any>({});
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => setSettings(data || {}))
      .catch((error) => console.error("Error fetching site settings:", error));
    fetch("/api/tools")
      .then((res) => res.json())
      .then((data) => setTools(data || []))
      .catch((error) => console.error("Error fetching tools:", error));
  }, []);

  const stockFor = (item: (typeof cartItems)[number]) => {
    if (item.type !== "tool") return null;
    return tools.find((t) => t.id === item.id)?.stock ?? null;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = Number(settings.freeShippingThreshold) || 0;
  const shippingAmount = Number(settings.shippingAmount) || 0;
  const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : shippingAmount;
  const total = subtotal + shipping;
  const canCheckout = cartItems.every((item) => {
    const stock = stockFor(item);
    return stock === null || stock === undefined || (stock > 0 && item.quantity <= stock);
  });

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted">{cartItems.length} items in your cart</p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted mx-auto mb-4" />
            <CardTitle className="mb-2">Your cart is empty</CardTitle>
            <p className="text-muted mb-6">Add some items to get started</p>
            <Link href="/books">
              <Button variant="primary">Browse E-Books</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => {
                const stock = stockFor(item);
                const isTool = item.type === "tool";
                const outOfStock = isTool && stock !== null && stock !== undefined && stock <= 0;
                const exceedsStock = isTool && stock !== null && stock !== undefined && item.quantity > stock;
                const atMax = isTool && stock !== null && stock !== undefined && item.quantity >= stock;
                const issue = outOfStock ? "Out of stock" : exceedsStock ? `Only ${stock} available` : null;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-4">
                      <div className="flex gap-4">
                        <div className="h-24 w-24 rounded-lg bg-muted-bg flex items-center justify-center shrink-0 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                          ) : item.type === "book" ? (
                            <BookOpen className="h-8 w-8 text-muted" />
                          ) : (
                            <Wrench className="h-8 w-8 text-muted" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <div>
                              <h3 className="font-medium">{item.title}</h3>
                              {item.author && <p className="text-sm text-muted">{item.author}</p>}
                              <Badge variant="blue" className="mt-1 text-xs capitalize">{item.type}</Badge>
                            </div>
                            <p className="font-bold">{formatCurrency(item.price)}</p>
                          </div>
                          {issue && <p className="text-xs text-red mb-2">{issue}</p>}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 rounded-lg bg-muted-bg hover:bg-white/10"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={atMax}
                                className="p-1 rounded-lg bg-muted-bg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red hover:text-red/80 flex items-center gap-1 text-sm"
                            >
                              <Trash2 className="h-4 w-4" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-24">
                <CardTitle className="mb-4">Order Summary</CardTitle>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Shipping</span>
                    <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                  </div>
                  {shipping > 0 && freeThreshold > 0 && (
                    <p className="text-xs text-muted">Free shipping on orders over {formatCurrency(freeThreshold)}</p>
                  )}
                  <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
                {canCheckout ? (
                  <Link href="/checkout">
                    <Button variant="primary" className="w-full">
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="primary" className="w-full" disabled>
                    Some items are unavailable
                  </Button>
                )}
                <Link href="/books">
                  <Button variant="ghost" className="w-full mt-2">
                    Continue Shopping
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
