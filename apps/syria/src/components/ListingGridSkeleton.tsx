/** Loading skeleton for browse grids — deterministic layout. */
export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] shadow-none"
        >
          <div className="aspect-[4/3] bg-[color:var(--darlink-surface-muted)]" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-[color:var(--darlink-surface-muted)]" />
            <div className="h-3 w-1/2 rounded bg-[color:var(--darlink-surface-muted)]" />
            <div className="h-4 w-1/3 rounded bg-[color:var(--darlink-surface-muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
