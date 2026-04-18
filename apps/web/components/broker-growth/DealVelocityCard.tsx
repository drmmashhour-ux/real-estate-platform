import type { BrokerGrowthMetrics } from "@/modules/broker-growth/broker-growth.types";

export function DealVelocityCard({ growth }: { growth: BrokerGrowthMetrics }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Vélocité & dossiers</h3>
      <dl className="mt-3 grid gap-2 text-sm text-zinc-300">
        <div className="flex justify-between gap-2">
          <dt>Première offre (proxy, j)</dt>
          <dd className="font-mono text-amber-100">
            {growth.velocity.avgTimeToAcceptedOfferDays ?? "—"}{" "}
            <span className="text-[10px] text-zinc-600">(n={growth.velocity.acceptedOfferSampleSize})</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Fermeture moy. (j)</dt>
          <dd className="font-mono text-amber-100">
            {growth.velocity.avgTimeToCloseDays ?? "—"}{" "}
            <span className="text-[10px] text-zinc-600">(n={growth.velocity.closeSampleSize})</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Dossiers actifs / bloqués</dt>
          <dd className="font-mono text-amber-100">
            {growth.velocity.activeDealCount} / {growth.velocity.blockedDealCount}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[10px] text-zinc-600">
        « Première offre » = médiane jours jusqu’à la première proposition initiale enregistrée (négociation), pas l’acceptation
        légale.
      </p>
    </div>
  );
}
