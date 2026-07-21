export type PaymentType = "competition_entry" | "premium_subscription" | "book_purchase" | "tool_purchase" | "job_access" | "refund";
export type PaymentMethod = "card" | "mobile_money" | "bank_transfer" | "paypal";
export type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";

export interface PaymentMethodRule {
  method: PaymentMethod;
  enabled: boolean;
  label: string;
  regions: "global" | "rwanda_only" | "international_only";
}

export interface PaymentContextSettings {
  context: PaymentType;
  label: string;
  methods: PaymentMethodRule[];
}

export type SupportedCurrency = "USD" | "RWF";

export interface CurrencyContextSettings {
  context: PaymentType;
  label: string;
  acceptedCurrencies: SupportedCurrency[];
}

export interface JudgeCredential {
  id: string;
  name: string;
  username: string;
  password: string;
  /** ISO date string e.g. "2026-12-31" — null means no expiry */
  expiresAt: string | null;
  /** Which competition(s) this judge is assigned to */
  assignedCompetition: string;
  active: boolean;
  createdAt: string;
  notes: string;
  /** Unique secure token used for the one-click access link. null = link not generated yet. */
  accessToken: string | null;
  /** ISO date string when the access link expires. null = link never expires. */
  accessLinkExpiresAt: string | null;
}

export interface JudgeReport {
  id: string;
  judgeId: string;
  judgeName?: string;
  competitionId: string | null;
  competitionTitle?: string;
  summary: {
    totalEntries: number;
    scored: number;
    avgScore: string;
    qualified: number;
    highest: { name: string; country: string; flag: string; score: number };
    lowest: { name: string; country: string; flag: string; score: number };
    competitionId?: string;
  } | null;
  criteriaAverages: { label: string; avg: number }[] | null;
  countries: { name: string; flag: string; entries: number; avgScore: number }[] | null;
  notes: string | null;
  status: "generated" | "submitted" | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCountry: string;
  type: PaymentType;
  description: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference: string;
  createdAt: string;
  paidAt?: string;
  competitionId?: string;
  competitionTitle?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCountry: string;
  type: PaymentType;
  description: string;
  amount: number;
  items: { description: string; amount: number; quantity: number }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  paymentId?: string;
}

export interface MonthlyStatement {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  totalIncome?: number;
  totalExpenses?: number;
  netBalance?: number;
  currency: string;
  generatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Generated/aggregate statement fields used by the statements UI
  month: string;
  year: number;
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
  byType: Record<PaymentType, number>;
}

export type UserRole =
  | "visitor"
  | "user"
  | "participant"
  | "admin"
  | "judge";

export type ApplicationStatus = "pending" | "approved" | "declined" | "expired";
export type PaymentStatus = "pending" | "completed" | "failed" | "expired";
export type CompetitionStatus = "upcoming" | "open" | "judging" | "completed";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isPremium: boolean;
  country?: string;
  phone?: string;
  avatar?: string;
  profileComplete?: boolean;
  subscriptionPlan?: string | null;
  subscriptionExpiry?: string | null;
  subscriptionDuration?: "weekly" | "monthly" | "yearly" | null;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Competition {
  id: string;
  title: string;
  slug: string;
  banner: string;
  difficulty: "Beginner" | "Intermediate" | "Professional" | "Master";
  prizePool: number;
  countriesAllowed: string[];
  registrationDeadline: string;
  eventTimeline: { date: string; event: string }[];
  requiredSkills: string[];
  entryFee: number;
  availableSlots: number;
  totalSlots: number;
  status: CompetitionStatus;
  organizer: string;
  rules: string[];
  judgingCriteria: string[];
  description: string;
  maxVideoDuration?: number;
  maxVideoSize?: number;
}

export interface Application {
  id: string;
  competitionId: string;
  userId: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  paymentDeadline?: string;
  submittedAt: string;
}

export interface CompetitionApplication {
  id: string;
  competitionId?: string;
  userId?: string | null;
  fullName?: string;
  userName?: string;
  userEmail?: string;
  email?: string;
  status?: string;
  paymentStatus?: string;
  country?: string;
  mobileNumber?: string;
  birthDate?: string;
  gender?: string;
  over18?: boolean;
  accessLink?: string;
  accessLinkExpiresAt?: string;
  nominatedAt?: string;
  paidAt?: string;
  competition?: {
    id?: string;
    title?: string;
    entryFee?: number;
  };
}

export interface CompetitionResult {
  id?: string;
  competitionId?: string;
  participantName?: string;
  rank?: number;
  score?: number;
  isWinner?: boolean;
  feedback?: string;
  createdAt?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  cover: string;
  description: string;
  isbn?: string;
  publishedDate?: string;
  currency: string;
  isPremium: boolean;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  brand: string;
  currency: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  country: string;
  location: string;
  salary: string;
  experience: string;
  type: string;
  category: string;
  price: number;
  status: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companySocials: { platform: string; url: string }[];
  description: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  purchased?: boolean;
}

export interface School {
  id: string;
  name: string;
  location: string;
  certifications: string;
  programs: string;
  rating: number;
  reviews: number;
  contact: string;
  website: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Legend {
  id: string;
  name: string;
  country: string;
  image: string;
  biography: string;
  achievements: string[];
  awards: string[];
  legacy: string;
  images: string[];
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  author: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  country: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface ScoreCategory {
  creativity: number;
  symmetry: number;
  precision: number;
  milkTexture: number;
  technique: number;
  overallPresentation: number;
}
