export function AlertsEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-center">
      <p className="text-sm font-semibold text-white">No alerts yet</p>
      <p className="mt-1 text-xs text-slate-400">
        We'll notify you when something meaningful changes on a saved property.
      </p>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-3 rounded-lg border border-premium-gold/40 px-3 py-1.5 text-xs text-premium-gold hover:bg-premium-gold/10"
        >
          Refresh watchlist
        </button>
      ) : null}
    </div>
  );
}
