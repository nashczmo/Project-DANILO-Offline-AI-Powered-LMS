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

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
