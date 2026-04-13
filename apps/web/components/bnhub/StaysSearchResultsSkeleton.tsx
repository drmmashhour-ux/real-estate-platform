/** Placeholder grid while BNHub stays search loads — instant layout feedback. */
export function StaysSearchResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="rounded-2xl border border-premium-gold/20 bg-[#141414] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
          >
            <div className="aspect-[16/10] animate-pulse bg-white/10" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-[80%] max-w-[200px] animate-pulse rounded bg-white/10" />
              <div className="h-3 w-[50%] max-w-[120px] animate-pulse rounded bg-white/10" />
              <div className="flex justify-between gap-2 pt-1">
                <div className="h-5 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-14 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-neutral-500">Finding stays…</p>
    </div>
  );
}
