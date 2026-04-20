import type { GlobalMarketplaceSummary } from "@/modules/global-intelligence/global-intelligence.types";

export function GlobalMarketplaceHero({ summary }: { summary: GlobalMarketplaceSummary | null }) {
  if (!summary) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-black p-6 text-zinc-400">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Global marketplace</p>
        <p className="mt-3 text-sm">Summary unavailable — enable adapters or flags.</p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-amber-900/40 bg-gradient-to-br from-black to-zinc-950 p-6 text-amber-50">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-500">LECIPM · international</p>
      <h2 className="mt-3 font-serif text-2xl text-amber-100">Multi-region snapshot</h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-400">
        Read-only aggregates — adapters supply normalized listings; Syria counters come from regional SQL scope.
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-black/60 p-4">
          <dt className="text-[10px] uppercase tracking-wide text-zinc-500">Regions wired</dt>
          <dd className="mt-1 text-xl font-semibold text-amber-300">{summary.regions.length}</dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/60 p-4">
          <dt className="text-[10px] uppercase tracking-wide text-zinc-500">Syria summary</dt>
          <dd className="mt-1 text-xl font-semibold text-amber-300">{summary.syriaSummaryAvailable ? "live" : "missing"}</dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/60 p-4">
          <dt className="text-[10px] uppercase tracking-wide text-zinc-500">Web CRM sample</dt>
          <dd className="mt-1 text-xl font-semibold text-amber-300">{summary.webListingSampleCount ?? 0}</dd>
        </div>
      </dl>
    </section>
  );
}
