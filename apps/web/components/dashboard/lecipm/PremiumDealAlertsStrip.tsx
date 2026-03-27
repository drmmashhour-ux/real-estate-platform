import Link from "next/link";

/** Surfaces investor deal-alert entry without duplicating heavy panels. */
export function PremiumDealAlertsStrip() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-500/25 bg-sky-950/20 px-4 py-3 text-sm text-sky-100/90">
      <p>
        <span className="font-semibold text-sky-200">Deal alerts</span> — watch for new opportunities across saved scenarios.
      </p>
      <Link href="/dashboard/investments/alerts" className="shrink-0 font-medium text-[#C9A646] hover:underline">
        Open alerts →
      </Link>
    </div>
  );
}
