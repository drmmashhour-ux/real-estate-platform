"use client";

export function LaunchSimulationCard({
  title,
  hosts,
  gainPerHost,
  disclaimer,
}: {
  title: string;
  hosts: number;
  gainPerHost: string;
  disclaimer: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{hosts} hosts</p>
      <p className="mt-1 text-sm text-zinc-400">Avg modeled gain / host: {gainPerHost}</p>
      <p className="mt-3 text-xs text-zinc-500">{disclaimer}</p>
    </div>
  );
}
