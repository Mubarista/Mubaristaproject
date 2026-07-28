"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const cleanPaths = ["/refund-policy", "/terms", "/privacy"];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/mbhubteam") || pathname?.startsWith("/muba2-admin");
  const isJudge = pathname?.startsWith("/judge");
  const isClean = pathname ? cleanPaths.includes(pathname) : false;

  if (isClean) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        <main className="flex-1 pt-16">{children}</main>
      </>
    );
  }

  const showSiteChrome = !isAdmin && !isJudge;

  return (
    <>
      {showSiteChrome && <Navbar />}
      <main className="flex-1">{children}</main>
      {showSiteChrome && <Footer />}
    </>
  );
}
