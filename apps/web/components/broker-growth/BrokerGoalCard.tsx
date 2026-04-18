import type { GrowthCoachSummary } from "@/modules/broker-growth-coach/growth-coach.types";

export function BrokerGoalCard({ coaching }: { coaching: GrowthCoachSummary | null }) {
  if (!coaching) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-700 bg-black/30 p-4 text-sm text-zinc-500">
        Activez le coach d’objectifs (<code className="text-amber-200/80">FEATURE_BROKER_GROWTH_COACH_V1</code>) pour des
        cibles et recommandations.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Coach & objectifs</h3>
      <p className="mt-2 text-sm text-zinc-300">{coaching.progressSummary}</p>
      <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-amber-100/90">
        {coaching.growthRecommendations.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs font-medium text-amber-200/90">Cette semaine: {coaching.bestNextActionThisWeek}</p>
    </div>
  );
}
