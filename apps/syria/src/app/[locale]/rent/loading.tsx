import { ListingGridSkeleton } from "@/components/ListingGridSkeleton";

export default function RentLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[color:var(--darlink-surface-muted)]" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-[color:var(--darlink-surface-muted)]" />
      </div>
      <div className="h-24 animate-pulse rounded-[var(--darlink-radius-2xl)] bg-[color:var(--darlink-surface-muted)]" />
      <ListingGridSkeleton count={6} />
    </div>
  );
}
