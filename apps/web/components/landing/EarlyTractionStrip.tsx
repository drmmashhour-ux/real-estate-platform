import { cn } from "@/lib/utils";
import { EARLY_TRUST } from "@/lib/growth/early-trust-content";

type EarlyTractionStripProps = {
  className?: string;
  /** @deprecated use `usersExploringText` */
  exploringText?: string;
  /** @deprecated use `highDemandText` */
  demandText?: string;
  usersExploringText?: string;
  recentBookingsText?: string;
  highDemandText?: string;
};

/**
 * Order 113 — small social proof to reduce cold-start trust gap.
 * Three trust lines: activity, recency, demand — override via props or `EARLY_TRUST` in code.
 */
export function EarlyTractionStrip({
  className,
  exploringText,
  demandText,
  usersExploringText,
  recentBookingsText,
  highDemandText,
}: EarlyTractionStripProps) {
  const a = usersExploringText ?? exploringText ?? EARLY_TRUST.usersExploring;
  const b = recentBookingsText ?? EARLY_TRUST.recentBookings;
  const c = highDemandText ?? demandText ?? EARLY_TRUST.highDemand;
  return (
    <div
      className={cn(
        "mx-auto mt-6 max-w-lg rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-left text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100/95",
        className
      )}
    >
      <p className="font-medium">Trust & activity</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-900/90 dark:text-amber-100/80">
        <li>{a}</li>
        <li>{b}</li>
        <li>{c}</li>
      </ul>
    </div>
  );
}
