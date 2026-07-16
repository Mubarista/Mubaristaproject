"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";

type SiteSettings = {
  logo?: string;
};

export function JudgeLogo({ className = "", iconClassName = "" }: { className?: string; iconClassName?: string }) {
  const [siteLogo, setSiteLogo] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: SiteSettings) => setSiteLogo(data?.logo || ""))
      .catch(() => {});
  }, []);

  return (
    <div
      className={`flex items-center justify-center rounded-lg ${className}`}
      style={{ background: siteLogo ? "transparent" : "linear-gradient(135deg, #c9a227, #f5c842)" }}
    >
      {siteLogo ? (
        <img src={siteLogo} alt="MUBARISTA" className="h-full w-full object-contain rounded" />
      ) : (
        <Scale className={`text-black ${iconClassName}`} strokeWidth={2} />
      )}
    </div>
  );
}
