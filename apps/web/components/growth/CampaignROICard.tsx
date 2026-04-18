"use client";

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CampaignROICard({
  campaignsCount,
  performance,
}: {
  campaignsCount: number;
  performance: {
    eventCount: number;
    impressions: number;
    clicks: number;
    amountByKey: Record<string, number>;
  };
}) {
  const spend = performance.amountByKey["spend"] ?? 0;
  const revenue = performance.amountByKey["revenue"] ?? 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">Campaigns & performance (90d)</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Saved UTM campaigns: <strong className="text-zinc-300">{campaignsCount}</strong>. Performance rows are from
        recorded marketing events only.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase text-zinc-500">Events</dt>
          <dd className="font-medium text-zinc-100">{performance.eventCount}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-zinc-500">Impressions / clicks</dt>
          <dd className="font-medium text-zinc-100">
            {performance.impressions} / {performance.clicks}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-zinc-500">Spend (reported)</dt>
          <dd className="font-medium text-zinc-100">{spend ? money(spend) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-zinc-500">Revenue (reported)</dt>
          <dd className="font-medium text-zinc-100">{revenue ? money(revenue) : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
