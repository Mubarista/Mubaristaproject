"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Competition, Article, Book, Tool, Job, School, Legend, Testimonial, Payment, Invoice, MonthlyStatement, PaymentContextSettings, CurrencyContextSettings, JudgeCredential } from "@/types";
import { platformStats as initPlatformStats } from "@/data/mock-data";

export type Winner = {
  id: string;
  name: string;
  country: string;
  competition: string;
  prize: string;
  image: string;
  artImage: string;
};

export type LatteArt = {
  id: string;
  title: string;
  artist: string;
  image: string;
  likes: number;
};

export type Sponsor = {
  name: string;
  logo: string;
};

export type CoffeeFact = {
  id: string;
  fact: string;
  icon: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  description: string;
  image: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CoffeeHistory = {
  id: string;
  year: string;
  title: string;
  description: string;
  image: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type LearnCategory = {
  id: string;
  title: string;
  description: string;
  icon: string;
  free: boolean;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type PlatformStats = {
  liveCompetitions: number;
  totalParticipants: number;
  countriesJoined: number;
  totalWinners: number;
};

export type HeroContent = {
  title: string;
  subtitle: string;
  badge: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type HeroBackground = {
  type: "image" | "video";
  imageUrl: string;
  videoUrl: string;
};

export type SupportedCountry = {
  name: string;
  code: string;   // ISO 3166-1 alpha-2, e.g. "US"
  dialCode: string; // e.g. "+1"
  flag: string;    // emoji flag
  isDefault?: boolean;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  duration: "weekly" | "monthly" | "yearly";
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
  active: boolean;
};

interface AdminDataContextType {
  // data
  supportedCountries: SupportedCountry[];
  setSupportedCountries: (v: SupportedCountry[]) => void;
  defaultCountryCode: string;
  setDefaultCountryCode: (code: string) => void;
  competitions: Competition[];
  winners: Winner[];
  latteArt: LatteArt[];
  testimonials: Testimonial[];
  sponsors: Sponsor[];
  coffeeFacts: CoffeeFact[];
  articles: Article[];
  faqs: FAQ[];
  learnCategories: LearnCategory[];
  books: Book[];
  tools: Tool[];
  jobs: Job[];
  schools: School[];
  timeline: TimelineEvent[];
  coffeeHistory: CoffeeHistory[];
  legends: Legend[];
  platformStats: PlatformStats;
  heroContent: HeroContent;
  heroBackground: HeroBackground;
  payments: Payment[];
  invoices: Invoice[];
  statements: MonthlyStatement[];
  subscriptionPlans: SubscriptionPlan[];

  // setters

  setCompetitions: (v: Competition[]) => void;
  setWinners: (v: Winner[]) => void;
  setLatteArt: (v: LatteArt[]) => void;
  setTestimonials: (v: Testimonial[]) => void;
  setSponsors: (v: Sponsor[]) => void;
  setCoffeeFacts: (v: CoffeeFact[]) => void;
  setArticles: (v: Article[]) => void;
  setFaqs: (v: FAQ[]) => void;
  setLearnCategories: (v: LearnCategory[]) => void;
  setBooks: (v: Book[]) => void;
  setTools: (v: Tool[]) => void;
  setJobs: (v: Job[]) => void;
  setSchools: (v: School[]) => void;
  setTimeline: (v: TimelineEvent[]) => void;
  setCoffeeHistory: (v: CoffeeHistory[]) => void;
  setLegends: (v: Legend[]) => void;
  setPlatformStats: (v: PlatformStats) => void;
  setHeroContent: (v: HeroContent) => void;
  setHeroBackground: (v: HeroBackground) => void;
  setPayments: (v: Payment[]) => void;
  setInvoices: (v: Invoice[]) => void;
  setStatements: (v: MonthlyStatement[]) => void;
  setSubscriptionPlans: (v: SubscriptionPlan[]) => void;
  paymentSettings: PaymentContextSettings[];
  setPaymentSettings: (v: PaymentContextSettings[]) => void;
  exchangeRate: number;
  setExchangeRate: (v: number) => void;
  currencySettings: CurrencyContextSettings[];
  setCurrencySettings: (v: CurrencyContextSettings[]) => void;
  judgeCredentials: JudgeCredential[];
  setJudgeCredentials: (v: JudgeCredential[]) => void;
}


const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

const initPayments: Payment[] = [];

const initInvoices: Invoice[] = [];

const DEFAULT_EXCHANGE_RATE = 1370;

const defaultCurrencySettings: CurrencyContextSettings[] = [
  { context: "competition_entry",    label: "Competition Entry Fees",    acceptedCurrencies: ["RWF"] },
  { context: "premium_subscription", label: "Premium Memberships",       acceptedCurrencies: ["RWF"] },
  { context: "book_purchase",        label: "Book / eBook Purchases",    acceptedCurrencies: ["RWF"] },
  { context: "tool_purchase",        label: "Barista Tools / Products",  acceptedCurrencies: ["RWF"] },
];

const ALL_METHODS: PaymentContextSettings["methods"] = [
  { method: "card", enabled: true, label: "Visa / Mastercard", regions: "global" },
  { method: "mobile_money", enabled: true, label: "MomoPay", regions: "global" },
  { method: "bank_transfer", enabled: true, label: "Bank Transfer", regions: "global" },
  { method: "paypal", enabled: true, label: "PayPal", regions: "global" },
];

const defaultPaymentSettings: PaymentContextSettings[] = [
  { context: "competition_entry", label: "Competition Entry Fees", methods: ALL_METHODS },
  { context: "premium_subscription", label: "Premium Memberships", methods: ALL_METHODS },
  { context: "book_purchase", label: "Book / eBook Purchases", methods: ALL_METHODS },
  { context: "tool_purchase", label: "Barista Tools / Products", methods: ALL_METHODS },
];

const initStatements: MonthlyStatement[] = [];

const defaultSupportedCountries: SupportedCountry[] = [
  { name: "United States",     code: "US", dialCode: "+1",   flag: "🇺🇸" },
  { name: "United Kingdom",    code: "GB", dialCode: "+44",  flag: "🇬🇧" },
  { name: "Australia",         code: "AU", dialCode: "+61",  flag: "🇦🇺" },
  { name: "Canada",            code: "CA", dialCode: "+1",   flag: "🇨🇦" },
  { name: "Germany",           code: "DE", dialCode: "+49",  flag: "🇩🇪" },
  { name: "France",            code: "FR", dialCode: "+33",  flag: "🇫🇷" },
  { name: "Italy",             code: "IT", dialCode: "+39",  flag: "🇮🇹" },
  { name: "Japan",             code: "JP", dialCode: "+81",  flag: "🇯🇵" },
  { name: "South Korea",       code: "KR", dialCode: "+82",  flag: "🇰🇷" },
  { name: "Brazil",            code: "BR", dialCode: "+55",  flag: "🇧🇷" },
  { name: "Mexico",            code: "MX", dialCode: "+52",  flag: "🇲🇽" },
  { name: "Saudi Arabia",      code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "South Africa",      code: "ZA", dialCode: "+27",  flag: "🇿🇦" },
  { name: "India",             code: "IN", dialCode: "+91",  flag: "🇮🇳" },
  { name: "China",             code: "CN", dialCode: "+86",  flag: "🇨🇳" },
  { name: "Singapore",         code: "SG", dialCode: "+65",  flag: "🇸🇬" },
  { name: "New Zealand",       code: "NZ", dialCode: "+64",  flag: "🇳🇿" },
  { name: "Netherlands",       code: "NL", dialCode: "+31",  flag: "🇳🇱" },
  { name: "Sweden",            code: "SE", dialCode: "+46",  flag: "🇸🇪" },
  { name: "Norway",            code: "NO", dialCode: "+47",  flag: "🇳🇴" },
  { name: "Denmark",           code: "DK", dialCode: "+45",  flag: "🇩🇰" },
  { name: "Spain",             code: "ES", dialCode: "+34",  flag: "🇪🇸" },
  { name: "Portugal",          code: "PT", dialCode: "+351", flag: "🇵🇹" },
  { name: "Turkey",            code: "TR", dialCode: "+90",  flag: "🇹🇷" },
  { name: "Ethiopia",          code: "ET", dialCode: "+251", flag: "🇪🇹" },
  { name: "Kenya",             code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { name: "Colombia",          code: "CO", dialCode: "+57",  flag: "🇨🇴" },
  { name: "Rwanda",             code: "RW", dialCode: "+250", flag: "🇷🇼", isDefault: true },
];

const defaultHeroBackground: HeroBackground = {
  type: "image",
  imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1920&q=80",
  videoUrl: "",
};

const defaultHero: HeroContent = {
  title: "Compete With The World's Best Baristas",
  subtitle:
    "Join the global platform where talented baristas learn, compete, grow their careers, and participate in international online latte art competitions.",
  badge: "Live competitions happening now",
  ctaPrimary: "Join Free Today",
  ctaSecondary: "Browse Competitions",
};

const defaultSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: "weekly",
    name: "Weekly",
    duration: "weekly",
    price: 9999,
    currency: "RWF",
    features: [
      "Access to all courses",
      "Weekly updates",
      "Email support"
    ],
    active: true,
  },
  {
    id: "monthly",
    name: "Monthly",
    duration: "monthly",
    price: 29999,
    currency: "RWF",
    features: [
      "Access to all courses",
      "Monthly updates",
      "Priority support",
      "Certificates"
    ],
    popular: true,
    active: true,
  },
  {
    id: "yearly",
    name: "Yearly",
    duration: "yearly",
    price: 199999,
    currency: "RWF",
    features: [
      "Access to all courses",
      "Yearly updates",
      "24/7 support",
      "Certificates",
      "Exclusive workshops"
    ],
    active: true,
  },
];

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [latteArt, setLatteArt] = useState<LatteArt[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [coffeeFacts, setCoffeeFacts] = useState<CoffeeFact[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [learnCategories, setLearnCategories] = useState<LearnCategory[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [coffeeHistory, setCoffeeHistory] = useState<CoffeeHistory[]>([]);
  const [legends, setLegends] = useState<Legend[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>(initPlatformStats);
  const [heroContent, setHeroContent] = useState<HeroContent>(defaultHero);
  const [heroBackground, setHeroBackground] = useState<HeroBackground>(defaultHeroBackground);
  const [supportedCountries, setSupportedCountries] = useState<SupportedCountry[]>(defaultSupportedCountries);
  const [defaultCountryCode, setDefaultCountryCode] = useState<string>("RW");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statements, setStatements] = useState<MonthlyStatement[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentContextSettings[]>(defaultPaymentSettings);
  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_EXCHANGE_RATE);
  const [currencySettings, setCurrencySettings] = useState<CurrencyContextSettings[]>(defaultCurrencySettings);
  const [judgeCredentials, setJudgeCredentials] = useState<JudgeCredential[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(defaultSubscriptionPlans);

  // Fetch all data from API on mount
  useEffect(() => {
    async function fetchAll() {
      const fetches: Promise<void>[] = [
        fetch("/api/competitions").then(r => r.ok ? r.json() : []).then(d => setCompetitions(d)).catch(() => {}),
        fetch("/api/winners").then(r => r.ok ? r.json() : []).then(d => setWinners(d)).catch(() => {}),
        fetch("/api/latte-art").then(r => r.ok ? r.json() : []).then(d => setLatteArt(d)).catch(() => {}),
        fetch("/api/testimonials").then(r => r.ok ? r.json() : []).then(d => setTestimonials(d)).catch(() => {}),
        fetch("/api/sponsors").then(r => r.ok ? r.json() : []).then(d => setSponsors(d)).catch(() => {}),
        fetch("/api/coffee-facts").then(r => r.ok ? r.json() : []).then(d => setCoffeeFacts(d)).catch(() => {}),
        fetch("/api/articles").then(r => r.ok ? r.json() : []).then(d => setArticles(d)).catch(() => {}),
        fetch("/api/faqs").then(r => r.ok ? r.json() : []).then(d => setFaqs(d)).catch(() => {}),
        fetch("/api/learn-categories?includeInactive=true").then(r => r.ok ? r.json() : []).then(d => setLearnCategories(d)).catch(() => {}),
        fetch("/api/books?includeInactive=true").then(r => r.ok ? r.json() : []).then(d => setBooks(d)).catch(() => {}),
        fetch("/api/tools?includeInactive=true").then(r => r.ok ? r.json() : []).then(d => setTools(d)).catch(() => {}),
        fetch("/api/jobs?includeInactive=true").then(r => r.ok ? r.json() : []).then(d => setJobs(d)).catch(() => {}),
        fetch("/api/schools?includeInactive=true").then(r => r.ok ? r.json() : []).then(d => setSchools(d)).catch(() => {}),
        fetch("/api/timeline?includeInactive=true").then(r => r.ok ? r.json() : []).then(d => setTimeline(d)).catch(() => {}),
        fetch("/api/about").then(r => r.ok ? r.json() : null).then(d => {
          if (d) {
            // Handle about data if needed
          }
        }).catch(() => {}),
        fetch("/api/coffee-history?includeInactive=true").then(r => r.ok ? r.json() : []).then(d => {
          // Handle coffee history data if needed
        }).catch(() => {}),
        fetch("/api/legends").then(r => r.ok ? r.json() : []).then(d => setLegends(d)).catch(() => {}),
        fetch("/api/judges").then(r => r.ok ? r.json() : []).then(d => setJudgeCredentials(d)).catch(() => {}),
        fetch("/api/payments").then(r => r.ok ? r.json() : []).then(d => setPayments(d)).catch(() => {}),
        fetch("/api/invoices").then(r => r.ok ? r.json() : []).then(d => setInvoices(d)).catch(() => {}),
        fetch("/api/statements").then(r => r.ok ? r.json() : []).then(d => setStatements(d)).catch(() => {}),
        fetch("/api/hero").then(r => r.ok ? r.json() : null).then(d => {
          if (d) {
            if (d.heroContent) setHeroContent(d.heroContent);
            if (d.heroBackground) setHeroBackground(d.heroBackground);
            if (d.platformStats) setPlatformStats(d.platformStats);
          }
        }).catch(() => {}),
        fetch("/api/platform-stats").then(r => r.ok ? r.json() : null).then(d => {
          if (d) setPlatformStats(d);
        }).catch(() => {}),
        fetch("/api/tips").then(r => r.ok ? r.json() : []).then(d => { /* tips stored in context if needed */ }).catch(() => {}),
        fetch("/api/subscription-plans?includeInactive=true").then(r => r.ok ? r.json() : []).then(d => setSubscriptionPlans(d)).catch(() => {}),
      ];
      await Promise.all(fetches);
    }
    fetchAll();
  }, []);

  return (
    <AdminDataContext.Provider
      value={{
        competitions, setCompetitions,
        winners, setWinners,
        latteArt, setLatteArt,
        testimonials, setTestimonials,
        sponsors, setSponsors,
        coffeeFacts, setCoffeeFacts,
        articles, setArticles,
        faqs, setFaqs,
        learnCategories, setLearnCategories,
        books, setBooks,
        tools, setTools,
        jobs, setJobs,
        schools, setSchools,
        timeline, setTimeline,
        coffeeHistory, setCoffeeHistory,
        legends, setLegends,
        platformStats, setPlatformStats,
        heroContent, setHeroContent,
        heroBackground, setHeroBackground,
        supportedCountries, setSupportedCountries,
        subscriptionPlans, setSubscriptionPlans,
        defaultCountryCode, setDefaultCountryCode,
        payments, setPayments,
        invoices, setInvoices,
        statements, setStatements,
        paymentSettings, setPaymentSettings,
        exchangeRate, setExchangeRate,
        currencySettings, setCurrencySettings,
        judgeCredentials, setJudgeCredentials,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
