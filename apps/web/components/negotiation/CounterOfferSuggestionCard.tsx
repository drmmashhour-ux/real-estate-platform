"use client";

export function CounterOfferSuggestionCard({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="rounded-lg border border-sky-500/20 bg-sky-950/20 p-3">
      <p className="text-sm font-medium text-sky-100">{title}</p>
      <p className="mt-1 text-xs text-sky-200/80">{summary}</p>
    </div>
  );
}
