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
    default: "MUBARISTA — Global Barista Platform",
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
  openGraph: {
    title: "MUBARISTA — Global Barista Platform",
    description: "Compete with the world's best baristas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var noopStorage = {
                  length: 0,
                  key: function() { return null; },
                  getItem: function() { return null; },
                  setItem: function() {},
                  removeItem: function() {},
                  clear: function() {}
                };
                try { window.localStorage; } catch (e) {
                  try { Object.defineProperty(window, 'localStorage', { value: noopStorage, writable: true, configurable: true }); } catch (e2) {}
                }
                try { window.sessionStorage; } catch (e) {
                  try { Object.defineProperty(window, 'sessionStorage', { value: noopStorage, writable: true, configurable: true }); } catch (e2) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AdminAuthProvider>
            <AdminDataProvider>
              <AuthProvider>
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
