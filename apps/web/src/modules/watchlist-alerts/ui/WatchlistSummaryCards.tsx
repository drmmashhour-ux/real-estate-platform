export function WatchlistSummaryCards({ summary }: { summary: any }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Saved Properties" value={summary.savedListings} />
      <Card label="Unread Alerts" value={summary.unreadAlerts} accent />
      <Card label="Changed Today" value={summary.changedToday} />
      <Card label="Strong Opportunities" value={summary.strongOpportunityUpdates} />
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? "text-[#C9A646]" : "text-white"}`}>{value}</p>
    </div>
  );
}
