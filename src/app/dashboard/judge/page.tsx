"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JudgeDashboardRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/judge"); }, [router]);
  return (
    <div className="pt-32 flex flex-col items-center justify-center min-h-screen gap-3">
      <p className="text-muted text-sm">Redirecting to Judge Portal…</p>
    </div>
  );
}
