import Link from "next/link";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function AlertsEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={<Bell className="h-7 w-7" strokeWidth={1.5} />}
      title="No alerts yet"
      description="Alerts appear when something meaningful changes on a saved property. Save a listing first, then check back after market or listing updates."
    >
      <>
        <Link
          href="/listings/saved"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:bg-premium-gold"
        >
          View saved listings
        </Link>
        <Link
          href="/explore"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/75 transition hover:border-premium-gold/35 hover:text-white"
        >
          Browse featured listings
        </Link>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-premium-gold/30 px-5 py-2.5 text-sm text-premium-gold transition hover:bg-premium-gold/10"
          >
            Refresh
          </button>
        ) : null}
      </>
    </EmptyState>
  );
}
