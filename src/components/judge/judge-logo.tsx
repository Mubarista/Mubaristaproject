"use client";

import { useEffect, useState } from "react";


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
      style={{ background: "transparent" }}
    >
      {siteLogo ? (
        <img src={siteLogo} alt="MUBARISTA" className="h-full w-full object-contain rounded" />
      ) : null}
    </div>
  );
}
