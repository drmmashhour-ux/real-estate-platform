import Link from "next/link";
import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function WatchlistEmptyState() {
  return (
    <EmptyState
      icon={<Bookmark className="h-7 w-7" strokeWidth={1.5} />}
      title="No saved properties yet"
      description="Save homes from search or a listing page to track alerts, price movement, and risk signals in one place."
    >
      <>
        <Link
          href="/explore"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:bg-premium-gold"
        >
          Browse featured listings
        </Link>
        <Link
          href="/listings"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/75 transition hover:border-premium-gold/35 hover:text-white"
        >
          Search all listings
        </Link>
        <Link
          href="/analysis"
          className="inline-flex min-h-[44px] items-center justify-center text-sm font-medium text-premium-gold/90 underline decoration-premium-gold/30 underline-offset-2 hover:text-premium-gold"
        >
          Open investment analysis
        </Link>
      </>
    </EmptyState>
  );
}
