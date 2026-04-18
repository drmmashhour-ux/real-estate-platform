export function MarketingSuggestionCard({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="rounded-lg border border-amber-900/30 bg-black/40 p-3 text-sm">
      <p className="font-medium text-amber-100/90">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-400">{summary}</p>
    </div>
  );
}
