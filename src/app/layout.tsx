import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AdminDataProvider } from "@/lib/admin-data-context";
import { AdminAuthProvider } from "@/lib/admin-auth-context";
import { JudgeAuthProvider } from "@/lib/judge-auth-context";
import { CartProvider } from "@/lib/cart-context";
import { OrderProvider } from "@/lib/order-context";
import { SiteChrome } from "@/components/layout/site-chrome";
import { AppBootLoader } from "@/components/layout/app-boot-loader";
import { SessionTimeout } from "@/components/session-timeout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MUBARISTA - THE BARISTA HUB™",
    template: "%s | MUBARISTA",
  },
  description:
    "The world's leading online platform for baristas. Learn, compete, grow your career, and participate in international latte art competitions.",
  keywords: [
    "barista",
    "latte art",
    "coffee competition",
    "barista training",
    "coffee jobs",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "MUBARISTA - THE BARISTA HUB™",
    description: "Compete with the world's best baristas.",
    type: "website",
  },
  twitter: {
    title: "MUBARISTA - THE BARISTA HUB™",
    description: "Compete with the world's best baristas.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <AppBootLoader />
        <ThemeProvider>
          <AdminAuthProvider>
            <AdminDataProvider>
              <AuthProvider>
                <SessionTimeout />
                <CartProvider>
                  <OrderProvider>
                    <JudgeAuthProvider>
                      <SiteChrome>{children}</SiteChrome>
                    </JudgeAuthProvider>
                  </OrderProvider>
                </CartProvider>
              </AuthProvider>
            </AdminDataProvider>
          </AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
