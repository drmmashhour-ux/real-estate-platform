import Link from "next/link";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function FeedEmptyState() {
  return (
    <EmptyState
      icon={<Sparkles className="h-7 w-7" strokeWidth={1.5} />}
      title="No deals in your feed yet"
      description="Run analysis on listings and save what fits your strategy — your feed fills as we match opportunities to your preferences."
    >
      <>
        <Link
          href="/analysis"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Analyze a listing
        </Link>
        <Link
          href="/explore"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white transition hover:bg-white/5"
        >
          Browse featured listings
        </Link>
      </>
    </EmptyState>
  );
}
