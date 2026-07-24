"use client";

import { useEffect } from "react";

interface AutoRedirectProps {
  url: string | null;
  fallback: string;
}

export function AutoRedirect({ url, fallback }: AutoRedirectProps) {
  useEffect(() => {
    if (url) {
      window.location.href = url;
    } else {
      window.location.href = fallback;
    }
  }, [url, fallback]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-center">
      <div className="glass-card rounded-2xl p-8 max-w-md">
        <h1 className="text-xl font-semibold mb-2">Opening your account…</h1>
        <p className="text-muted text-sm">If you are not redirected automatically, <a href={url || fallback} className="text-blue hover:underline">click here</a>.</p>
      </div>
    </div>
  );
}
