"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type NextImageProps = Omit<
  React.ComponentProps<typeof Image>,
  "onLoad" | "onError" | "onLoadingComplete" | "alt"
>;

interface ImageWithSkeletonProps extends NextImageProps {
  skeletonClassName?: string;
  alt?: string;
}

export function ImageWithSkeleton({
  className,
  skeletonClassName,
  alt = "",
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <>
      {!loaded && !failed && (
        <div
          aria-hidden
          className={cn(
            "skeleton-shimmer absolute inset-0 z-[1]",
            skeletonClassName
          )}
        />
      )}
      <Image
        {...props}
        ref={imgRef}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </>
  );
}
