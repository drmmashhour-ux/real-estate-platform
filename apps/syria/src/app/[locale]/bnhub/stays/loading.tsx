import { ListingGridSkeleton } from "@/components/ListingGridSkeleton";

export default function BnhubStaysLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-[color:var(--darlink-surface-muted)]" />
        <div className="h-4 w-full max-w-md rounded bg-[color:var(--darlink-surface-muted)]" />
      </div>
      <div className="h-24 rounded-[var(--darlink-radius-2xl)] bg-[color:var(--darlink-surface-muted)]" />
      <ListingGridSkeleton count={6} />
    </div>
  );
}
