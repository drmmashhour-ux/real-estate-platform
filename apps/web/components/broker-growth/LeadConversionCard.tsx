import type { BrokerGrowthMetrics } from "@/modules/broker-growth/broker-growth.types";

export function LeadConversionCard({ growth }: { growth: BrokerGrowthMetrics }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Santé pipeline CRM</h3>
      <dl className="mt-3 grid gap-2 text-sm text-zinc-300">
        <div className="flex justify-between gap-2">
          <dt>Gagnés (fenêtre)</dt>
          <dd className="font-mono text-amber-100">{growth.pipeline.leadConversionSampleWon}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Perdus (fenêtre)</dt>
          <dd className="font-mono text-amber-100">{growth.pipeline.leadConversionSampleLost}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Ratio offres / actives</dt>
          <dd className="font-mono text-amber-100">{growth.pipeline.offerActivityRate ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
