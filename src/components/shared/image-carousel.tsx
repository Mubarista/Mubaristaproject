"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageItem {
  url: string;
  caption?: string;
}

interface ImageCarouselProps {
  images: (string | ImageItem)[];
  alt: string;
  aspectRatio?: string;
  className?: string;
  objectFit?: "contain" | "cover";
}

export function ImageCarousel({ images, alt, aspectRatio = "3/4", className = "", objectFit = "contain" }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [imageAspects, setImageAspects] = useState<Record<number, string>>({});
  const touchStartX = useRef<number | null>(null);
  const imgRefs = useRef<HTMLImageElement[]>([]);
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(new Set());

  const normalized = images.map((img) =>
    typeof img === "string" ? { url: img, caption: "" } : img
  );

  useEffect(() => {
    // Calculate aspect ratios after images load
    imgRefs.current.forEach((img, i) => {
      if (img && objectFit !== "contain") return;
      const ratio = img.naturalWidth / img.naturalHeight;
      const minRatio = 3 / 4;
      const maxRatio = 4 / 3;
      if (ratio >= minRatio && ratio <= maxRatio) {
        setImageAspects((aspects) => ({
          ...aspects,
          [i]: `${img.naturalWidth}/${img.naturalHeight}`,
        }));
      }
    });
  }, [index, objectFit]);

  useEffect(() => {
    if (normalized.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % normalized.length);
    }, 4000);
    return () => clearInterval(id);
  }, [normalized.length]);

  if (!normalized || normalized.length === 0) return null;

  const prev = () => setIndex((i) => (i === 0 ? normalized.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === normalized.length - 1 ? 0 : i + 1));

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0].screenX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  }

  const activeAspect = imageAspects[index] || aspectRatio;
  const active = normalized[index];

  return (
    <div className={className}>
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-muted-bg"
        style={{ aspectRatio: activeAspect }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {normalized.map((item, i) => (
          <div
            key={`${item.url}-${i}`}
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${(i - index) * 100}%)` }}
          >
            {!loadedSlides.has(i) && (
              <div aria-hidden className="skeleton-shimmer absolute inset-0 z-[1]" />
            )}
            <Image
              src={item.url}
              alt={`${alt} ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={cn(
                objectFit === "cover" ? "object-cover" : "object-contain",
                "transition-opacity duration-500",
                loadedSlides.has(i) ? "opacity-100" : "opacity-0"
              )}
              loading="eager"
              ref={(el) => { if (el) imgRefs.current[i] = el; }}
              onLoad={() => setLoadedSlides((prev) => new Set(prev).add(i))}
            />
          </div>
        ))}

        {normalized.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {normalized.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {active.caption && (
        <p className="mt-3 text-center text-sm text-muted px-2">{active.caption}</p>
      )}
    </div>
  );
}