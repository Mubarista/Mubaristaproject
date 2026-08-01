"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-lg",
        className
      )}
    />
  );
}

export function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 glass-card space-y-4",
        className
      )}
    >
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-10 rounded-full", className)} />;
}

export function SkeletonBadge({ className }: { className?: string }) {
  return <Skeleton className={cn("h-6 w-16 rounded-full", className)} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-24 rounded-xl", className)} />;
}

export function SkeletonIcon({ className }: { className?: string }) {
  return <Skeleton className={cn("h-6 w-6", className)} />;
}

export function SkeletonImage({ className }: { className?: string }) {
  return <Skeleton className={cn("h-40 w-full rounded-xl", className)} />;
}

/**
 * Hook that ensures loading state is shown for a minimum duration.
 * Prevents skeleton flash when data loads too quickly.
 * 
 * @param isDataReady - Whether the actual data has finished loading
 * @param minDuration - Minimum time (ms) to show the skeleton (default: 600ms)
 * @returns shouldShowSkeleton - Whether to display skeleton UI
 */
export function useDelayedLoading(isDataReady: boolean, minDuration: number = 600): boolean {
  const [shouldShowSkeleton, setShouldShowSkeleton] = useState(true);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Reset timer when data starts loading again
    if (!isDataReady) {
      startTimeRef.current = Date.now();
      setShouldShowSkeleton(true);
      return;
    }

    // Data is ready - check if minimum duration has passed
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = minDuration - elapsed;

    if (remaining <= 0) {
      // Minimum time already passed, hide skeleton immediately
      setShouldShowSkeleton(false);
    } else {
      // Wait for remaining time before hiding skeleton
      const timer = setTimeout(() => {
        setShouldShowSkeleton(false);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [isDataReady, minDuration]);

  return shouldShowSkeleton;
}

/**
 * Wrapper component that fades in content after skeleton loading.
 * Provides smooth transition from skeleton to actual content.
 */
export function SkeletonWrapper({
  isLoading,
  skeleton,
  children,
  minDuration = 600,
  className,
}: {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  minDuration?: number;
  className?: string;
}) {
  const showSkeleton = useDelayedLoading(!isLoading, minDuration);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!showSkeleton && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [showSkeleton, hasLoaded]);

  if (showSkeleton) {
    return <div className={className}>{skeleton}</div>;
  }

  return (
    <div className={cn("skeleton-fade-in", className)}>
      {children}
    </div>
  );
}

/* Dashboard-specific skeleton components */

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-6 glass-card text-center space-y-3">
          <Skeleton className="h-6 w-6 mx-auto rounded-lg" />
          <Skeleton className="h-8 w-12 mx-auto" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function DashboardActivitySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted-bg">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function DashboardQuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 glass-card space-y-3">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ApplicationCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 glass-card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="border-t border-white/5 pt-4">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function AddressCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 glass-card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-8 w-32 rounded-xl" />
    </div>
  );
}

export function MessageCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 glass-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function MessageDetailSkeleton() {
  return (
    <div className="rounded-2xl p-6 glass-card space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function SubscriptionPlanSkeleton() {
  return (
    <div className="rounded-2xl p-4 glass-card space-y-4">
      <div className="text-center space-y-3">
        <Skeleton className="h-6 w-24 mx-auto" />
        <Skeleton className="h-8 w-20 mx-auto" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}