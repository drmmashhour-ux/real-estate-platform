export function WatchlistEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-center">
      <p className="text-base font-semibold text-white">No saved properties yet</p>
      <p className="mt-2 text-sm text-slate-400">
        Save properties to track score changes, pricing updates, and risk signals.
      </p>
      <a href="/analysis" className="mt-4 inline-flex rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black hover:bg-[#e8c547]">
        Explore deals
      </a>
    </div>
  );
}
