"use client";

type Props = {
  refreshing: boolean;
  onRefresh: () => void;
};

export function WatchlistTopBar({ refreshing, onRefresh }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-white">Watchlist</h1>
        <p className="mt-1 text-sm text-slate-400">Track saved properties and important changes.</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="rounded-lg border border-premium-gold/40 px-3 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10 disabled:opacity-60"
      >
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}
