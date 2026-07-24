"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/mbhubteam");
  const isJudge = pathname.startsWith("/judge");
  const showSiteChrome = !isAdmin && !isJudge;

  return (
    <>
      {showSiteChrome && <Navbar />}
      <main className="flex-1">{children}</main>
      {showSiteChrome && <Footer />}
    </>
  );
}
