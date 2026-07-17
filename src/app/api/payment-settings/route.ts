import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

const ALL_METHODS = [
  { method: "card", enabled: true, label: "Visa / Mastercard", regions: "global" },
  { method: "mobile_money", enabled: true, label: "MTN Mobile Money", regions: "global" },
  { method: "bank_transfer", enabled: true, label: "Bank Transfer", regions: "global" },
  { method: "paypal", enabled: true, label: "PayPal", regions: "global" },
];

const defaultPaymentSettings = [
  { context: "competition_entry", label: "Competition Entry Fees", methods: ALL_METHODS },
  { context: "premium_subscription", label: "Premium Memberships", methods: ALL_METHODS },
  { context: "book_purchase", label: "Book / eBook Purchases", methods: ALL_METHODS },
  { context: "tool_purchase", label: "Barista Tools / Products", methods: ALL_METHODS },
];

const defaultCurrencySettings = [
  { context: "competition_entry", label: "Competition Entry Fees", acceptedCurrencies: ["RWF"] },
  { context: "premium_subscription", label: "Premium Memberships", acceptedCurrencies: ["RWF"] },
  { context: "book_purchase", label: "Book / eBook Purchases", acceptedCurrencies: ["RWF"] },
  { context: "tool_purchase", label: "Barista Tools / Products", acceptedCurrencies: ["RWF"] },
];

const DEFAULT_EXCHANGE_RATE = 1370;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("payment_settings").select("*").limit(1).single();
    if (error || !data) {
      return NextResponse.json({
        paymentMethods: defaultPaymentSettings,
        currencySettings: defaultCurrencySettings,
        exchangeRate: DEFAULT_EXCHANGE_RATE,
        stripePublishableKey: "",
        stripeSecretKey: "",
        stripeWebhookSecret: "",
        currency: "RWF",
        minimumAmount: 0,
      });
    }
    const settings = mapKeysToCamelCase(data);
    return NextResponse.json({
      ...settings,
      paymentMethods: settings.paymentMethods || defaultPaymentSettings,
      currencySettings: settings.currencySettings || defaultCurrencySettings,
      exchangeRate: settings.exchangeRate || DEFAULT_EXCHANGE_RATE,
    });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json({
      paymentMethods: defaultPaymentSettings,
      currencySettings: defaultCurrencySettings,
      exchangeRate: DEFAULT_EXCHANGE_RATE,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("payment_settings").upsert({ 
      id: "settings-1", 
      ...keysToSnakeCase(body), 
      updated_at: new Date().toISOString() 
    }).select().single();
    if (error) throw error;
    const settings = mapKeysToCamelCase(data);
    return NextResponse.json({
      ...settings,
      paymentMethods: settings.paymentMethods || defaultPaymentSettings,
      currencySettings: settings.currencySettings || defaultCurrencySettings,
      exchangeRate: settings.exchangeRate || DEFAULT_EXCHANGE_RATE,
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return NextResponse.json({ error: "Failed to update payment settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}

export async function DELETE() {
  return NextResponse.json({ error: "Cannot delete payment settings" }, { status: 400 });
}
