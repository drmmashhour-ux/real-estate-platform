type Metrics = {
  openCases: number;
  listingsVerifiedPercent: number | null;
  declarationCompletePercent: number | null;
  mortgageReadyPercent: number | null;
  slaOnTrackPercent: number | null;
};

export function WorkspaceTrustSummaryCards({ metrics }: { metrics: Metrics }) {
  const cards = [
    { label: "Open cases", value: metrics.openCases },
    { label: "Verified / high trust", value: metrics.listingsVerifiedPercent != null ? `${metrics.listingsVerifiedPercent}%` : "—" },
    { label: "Declaration ready", value: metrics.declarationCompletePercent != null ? `${metrics.declarationCompletePercent}%` : "—" },
    { label: "SLA on track", value: metrics.slaOnTrackPercent != null ? `${metrics.slaOnTrackPercent}%` : "—" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="text-sm text-neutral-500">{c.label}</div>
          <div className="mt-1 text-2xl font-semibold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
