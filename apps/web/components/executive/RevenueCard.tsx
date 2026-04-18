import type { RevenueMetrics } from "@/modules/metrics/metrics.types";

export function RevenueCard({ revenue }: { revenue: RevenueMetrics }) {
  return (
    <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
      <h2 className="text-sm font-semibold text-white">Revenue mix (realized)</h2>
      <ul className="mt-4 space-y-2 text-sm text-ds-text-secondary">
        <li className="flex justify-between">
          <span>BNHub / transaction-linked</span>
          <span className="tabular-nums text-white">{(revenue.bnhubCommissionCents / 100).toFixed(0)}</span>
        </li>
        <li className="flex justify-between">
          <span>Subscriptions</span>
          <span className="tabular-nums text-white">{(revenue.subscriptionRevenueCents / 100).toFixed(0)}</span>
        </li>
        <li className="flex justify-between">
          <span>Featured / promotions</span>
          <span className="tabular-nums text-white">{(revenue.featuredRevenueCents / 100).toFixed(0)}</span>
        </li>
        <li className="flex justify-between border-t border-white/10 pt-2">
          <span className="font-medium text-ds-gold">Other / platform fees bucket</span>
          <span className="tabular-nums text-ds-gold">{(revenue.platformFeesCents / 100).toFixed(0)}</span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Bucketed by `revenueType` string heuristics — verify in finance exports before board use.
      </p>
    </div>
  );
}
