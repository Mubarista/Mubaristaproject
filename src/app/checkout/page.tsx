"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CreditCard, Lock, Check, Loader2, Smartphone, Phone } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useAdminData } from "@/lib/admin-data-context";
import { useOrders } from "@/lib/order-context";
import { createPayment } from "@/lib/payment";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { validatePhoneNumber } from "@/lib/phone-utils";
import { formatCurrency } from "@/lib/utils";
import { VisaIcon } from "@/components/icons/visa";
import { MastercardIcon } from "@/components/icons/mastercard";
import { MtnMomoIcon } from "@/components/icons/mtn-momo";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, cartCount, clearCart } = useCart();
  const { supportedCountries } = useAdminData();
  const { addOrder } = useOrders();
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"details" | "payment-method" | "payment" | "momo" | "processing" | "success">("details");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "momo" | null>(null);
  const [momoPhone, setMomoPhone] = useState("");
  const [momoPhoneError, setMomoPhoneError] = useState<string | null>(null);
  const [momoCode, setMomoCode] = useState("");
  const [momoStep, setMomoStep] = useState<"phone" | "code">("phone");

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    country: user?.country || "",
    zipCode: "",
  });

  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + shipping;

  if (cartCount === 0 && step !== "processing" && step !== "success") {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Card className="text-center py-16 max-w-md">
          <p className="text-muted mb-4">Your cart is empty</p>
          <Link href="/tools">
            <Button variant="primary">Browse Products</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment-method");
  };

  const handlePaymentMethodSelect = (method: "card" | "momo") => {
    setPaymentMethod(method);
    if (method === "card") {
      setStep("payment");
    } else {
      setStep("momo");
    }
  };

  async function recordPayment(orderId: string) {
    if (!user) return;
    const paymentType = cartItems.some((item) => item.type === "tool") ? "tool_purchase" : "book_purchase";
    const itemNames = cartItems.map((item) => `${item.title} x${item.quantity}`).join(", ");
    await createPayment({
      userId: user.id,
      userName: formData.fullName,
      userEmail: formData.email,
      userCountry: formData.country,
      type: paymentType,
      description: `Order ${orderId}: ${itemNames}`,
      amount: total,
      currency: "RWF",
      method: paymentMethod || "card",
      reference: orderId,
      status: "completed",
    });
  }

  async function deliverBookPdfs(orderId: string) {
    const bookItems = cartItems.filter((item) => item.type === "book");
    if (bookItems.length === 0) return;

    try {
      await fetch("/api/books/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookIds: bookItems.map((item) => item.id),
          email: formData.email,
          customerName: formData.fullName,
          orderId,
        }),
      });
    } catch (error) {
      console.error("Error delivering book PDFs:", error);
    }
  }

  const handleMomoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (momoStep === "phone") {
      const validation = validatePhoneNumber(momoPhone);
      if (!validation.valid) {
        setMomoPhoneError(validation.error || "Enter a valid phone number");
        return;
      }
      setMomoPhoneError(null);
      // Simulate sending SMS code
      setMomoStep("code");
    } else {
      // Verify code and proceed
      setProcessing(true);
      setStep("processing");
      await new Promise(resolve => setTimeout(resolve, 3000));
      const order = addOrder({
        items: cartItems,
        total,
        shippingAddress: formData,
      });
      clearCart();
      await recordPayment(order.id);
      await deliverBookPdfs(order.id);
      setStep("success");
      setProcessing(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setStep("processing");

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Save order to history
    const order = addOrder({
      items: cartItems,
      total,
      shippingAddress: formData,
    });

    clearCart();
    await recordPayment(order.id);
    await deliverBookPdfs(order.id);
    setStep("success");
    setProcessing(false);
  };

  if (step === "processing") {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Card className="text-center py-16 max-w-md">
          <LoadingDots />
          <CardTitle className="mb-2">Processing Payment</CardTitle>
          <p className="text-muted">Please wait while we process your payment...</p>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Card className="text-center py-16 max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="h-24 w-24 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              <Check className="h-12 w-12 text-green" />
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CardTitle className="mb-2">Payment Successful!</CardTitle>
            <p className="text-muted mb-6">Thank you for your purchase. Your order has been confirmed.</p>
            <div className="space-y-3">
              <Link href="/dashboard">
                <Button variant="primary" className="w-full">Go to Account</Button>
              </Link>
              <Link href="/tools">
                <Button variant="ghost" className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </motion.div>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/cart" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {step === "details" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-6">
                  <CardTitle className="mb-6">Shipping Information</CardTitle>
                  <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm text-muted mb-1 block">Full Name</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted mb-1 block">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted mb-1 block">Phone</label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        placeholder="788123456"
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted mb-1 block">Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted mb-1 block">City</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted mb-1 block">ZIP Code</label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                          required
                          className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted mb-1 block">Country</label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                        className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue appearance-none"
                      >
                        <option value="">Select your country</option>
                        {supportedCountries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button variant="primary" type="submit" className="w-full">
                      Continue to Payment
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}

            {step === "payment-method" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-6">
                  <CardTitle className="mb-6">Select Payment Method</CardTitle>
                  <div className="space-y-4">
                    <button
                      onClick={() => handlePaymentMethodSelect("card")}
                      className="w-full p-4 rounded-xl border border-white/10 hover:border-blue/50 transition-colors flex items-center gap-4 text-left"
                    >
                      <div className="h-12 w-12 rounded-lg bg-blue/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Credit/Debit Card</h3>
                        <p className="text-sm text-muted">Visa or Mastercard</p>
                      </div>
                      <div className="flex gap-2">
                        <VisaIcon className="h-8 w-12" />
                        <MastercardIcon className="h-8 w-12" />
                      </div>
                    </button>

                    {formData.country === "RW" && (
                      <button
                        onClick={() => handlePaymentMethodSelect("momo")}
                        className="w-full p-4 rounded-xl border border-white/10 hover:border-yellow/50 transition-colors flex items-center gap-4 text-left"
                      >
                        <div className="h-12 w-12 rounded-lg bg-yellow/10 flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-yellow" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">MomoPay</h3>
                          <p className="text-sm text-muted">Pay with your mobile money account</p>
                        </div>
                        <MtnMomoIcon className="h-8 w-12" />
                      </button>
                    )}

                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setStep("details")}
                      className="w-full"
                    >
                      Back
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {step === "momo" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-6">
                  <CardTitle className="mb-6 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-yellow" />
                    MomoPay
                  </CardTitle>
                  <form onSubmit={handleMomoSubmit} className="space-y-4">
                    {momoStep === "phone" && (
                      <>
                        <div>
                          <label className="text-sm text-muted mb-1 block">Mobile Money Number</label>
                          <PhoneInput
                            value={momoPhone}
                            onChange={(value) => {
                              setMomoPhone(value);
                              setMomoPhoneError(null);
                            }}
                            placeholder="788123456"
                            required
                            className="w-full"
                          />
                          {momoPhoneError && (
                            <p className="text-xs text-red mt-1">{momoPhoneError}</p>
                          )}
                          <p className="text-xs text-muted mt-1">Enter your MomoPay number with country code (e.g. +250 788 123 456)</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted mt-4">
                          <Lock className="h-3 w-3" />
                          <span>You will receive an SMS confirmation code on this number.</span>
                        </div>
                      </>
                    )}

                    {momoStep === "code" && (
                      <>
                        <div className="bg-yellow/10 border border-yellow/30 rounded-xl p-4 mb-4">
                          <p className="text-sm text-yellow">
                            <Phone className="h-4 w-4 inline mr-2" />
                            SMS confirmation code sent to {momoPhone}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-muted mb-1 block">Confirmation Code</label>
                          <input
                            type="text"
                            value={momoCode}
                            onChange={(e) => setMomoCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            required
                            maxLength={6}
                            className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          if (momoStep === "code") {
                            setMomoStep("phone");
                          } else {
                            setStep("payment-method");
                          }
                        }}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button variant="primary" type="submit" className="flex-1" disabled={processing}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : momoStep === "phone" ? "Send Code" : "Confirm Payment"}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-6">
                  <CardTitle className="mb-6 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Card Payment (Visa/Mastercard)
                  </CardTitle>
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm text-muted mb-1 block">Card Number</label>
                      <input
                        type="text"
                        value={cardData.cardNumber}
                        onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                        placeholder="1234 5678 9012 3456"
                        required
                        maxLength={19}
                        className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted mb-1 block">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardData.cardName}
                        onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                        placeholder="Iraguha Mugisha"
                        required
                        className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted mb-1 block">Expiry Date</label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          placeholder="MM/YY"
                          required
                          maxLength={5}
                          className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted mb-1 block">CVV</label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          placeholder="123"
                          required
                          maxLength={3}
                          className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted mt-4">
                      <Lock className="h-3 w-3" />
                      <span>This is a demo payment. No real charges will be made.</span>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => setStep("payment-method")}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button variant="primary" type="submit" className="flex-1" disabled={processing}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay Now"}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-24">
              <CardTitle className="mb-4">Order Summary</CardTitle>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.title} x{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
