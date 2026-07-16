"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect based on user role
    if (!user) {
      router.push("/login");
    } else if (user.role === "admin") {
      router.push("/muba2-admin");
    } else {
      router.push("/dashboard/user");
    }
    setLoading(false);
  }, [user, router]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return null; // This page just redirects
}
