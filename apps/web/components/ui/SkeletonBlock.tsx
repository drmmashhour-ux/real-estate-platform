/** Dark-theme skeleton for dashboards and cards. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-800 via-slate-700/80 to-slate-800 bg-[length:200%_100%] ${className}`.trim()}
      aria-hidden
    />
  );
}

export function ListingsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
        >
          <SkeletonBlock className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <SkeletonBlock className="h-4 w-[85%]" />
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
