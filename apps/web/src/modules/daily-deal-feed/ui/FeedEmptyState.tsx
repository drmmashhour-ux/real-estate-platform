export function FeedEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-5 text-center">
      <p className="text-sm font-semibold text-white">No deals in your feed yet</p>
      <p className="mt-2 text-sm text-slate-400">
        Analyze more listings or adjust preferences to generate a stronger personalized feed.
      </p>
      <a href="/analysis" className="mt-4 inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5">
        Analyze listings
      </a>
    </div>
  );
}
