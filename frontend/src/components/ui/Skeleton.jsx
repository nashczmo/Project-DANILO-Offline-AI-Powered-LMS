import { memo } from "react";
import { cn } from "../../lib/utils";

export const Skeleton = memo(function Skeleton({ className, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-pulse rounded-xl bg-danilo-surface-hover", className)} />
      ))}
    </>
  );
});

export function CardSkeleton() {
  return (
    <div className="dn-card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/* Student AI-native hero skeleton */
function StudentHeroSkeleton() {
  return (
    <div className="rounded-3xl border border-danilo-border bg-danilo-surface p-6 sm:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24 rounded-xl" />
        <Skeleton className="h-7 w-20 rounded-xl" />
        <Skeleton className="h-7 w-20 rounded-xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-28 rounded-xl" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

/* Student AI quick-ask bar skeleton */
function QuickAskSkeleton() {
  return (
    <div className="dn-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-lg" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-2 flex-wrap">
        {[96, 64, 88, 80, 80, 104].map((w, i) => (
          <Skeleton key={i} className={`h-7 rounded-xl`} style={{ width: `${w}px` }} />
        ))}
      </div>
    </div>
  );
}

/* Skeleton for the student dashboard */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <StudentHeroSkeleton />
      <QuickAskSkeleton />
      <div className="grid gap-5 lg:grid-cols-[1fr_288px] xl:grid-cols-[1fr_304px]">
        {/* Left column */}
        <div className="space-y-5">
          <CardSkeleton />
          <div className="space-y-3">
            <Skeleton className="h-4 w-36" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          </div>
        </div>
        {/* Right column */}
        <div className="space-y-5">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
