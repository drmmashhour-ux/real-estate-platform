import { fusionSystemFlags, isFusionOrchestrationActive } from "@/config/feature-flags";
import { buildFusionPrimarySurface } from "@/modules/fusion/fusion-system.primary-surface";

/** Compact Fusion V1 block — advisory only; does not drive execution. */
export async function GrowthFusionSystemSection() {
  if (!fusionSystemFlags.fusionSystemV1) {
    return null;
  }

  const active = isFusionOrchestrationActive();
  const surface = active ? await buildFusionPrimarySurface().catch(() => null) : null;
  const snap = surface?.snapshot ?? null;
  const pres = surface?.presentation;
  const obs = surface?.observability;

  return (
    <div className="mt-3 rounded-lg border border-violet-900/40 bg-violet-950/15 px-3 py-2 text-[11px] text-zinc-400">
      <span className="font-semibold text-violet-300/90">Fusion System V1</span> · orchestration{" "}
      {active ? <span className="text-emerald-400/90">active</span> : <span className="text-zinc-500">inactive</span>}
      <span className="text-zinc-600"> · shadow {fusionSystemFlags.fusionSystemShadowV1 ? "on" : "off"}</span>
      <span className="text-zinc-600"> · persistence {fusionSystemFlags.fusionSystemPersistenceV1 ? "on" : "off"}</span>
      <span className="text-zinc-600"> · influence {fusionSystemFlags.fusionSystemInfluenceV1 ? "on" : "off"}</span>
      <span className="text-zinc-600"> · primary surface {fusionSystemFlags.fusionSystemPrimaryV1 ? "flag on" : "flag off"}</span>
      {surface?.primaryPresentationActive ? (
        <span className="text-zinc-600"> · primary presentation active</span>
      ) : null}
      {surface?.fallbackUsed ? (
        <span className="text-amber-200/70"> · primary fallback ({surface.fallbackReason ?? "unknown"})</span>
      ) : null}
      {pres ? (
        <div className="mt-1 space-y-0.5 border-t border-violet-900/30 pt-1 text-zinc-500">
          <div className="text-violet-200/80">Primary advisory surface (ranked buckets)</div>
          <div>
            {pres.rankedRecommendations.slice(0, 4).map((r) => (
              <span key={`${r.kind}-${r.title}`} className="mr-2 text-zinc-400">
                {r.kind}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-zinc-600">{pres.provenanceNote}</div>
          {obs ? (
            <div className="text-[10px] text-zinc-600">
              systems {obs.contributingSystemsCount} · fused items {obs.fusedItemCount} · conflicts {obs.conflictCount}{" "}
              · coverage {obs.sourceCoverageSummary}
            </div>
          ) : null}
        </div>
      ) : null}
      {snap ? (
        <div className="mt-1 space-y-0.5 text-zinc-500">
          <div>
            Signals {snap.signals.length} · conflicts {snap.conflicts.length} · agreement ~{" "}
            {snap.scores.agreementScore.toFixed(2)}
          </div>
          <div>
            Top advisory (source snapshot):{" "}
            {snap.recommendations.slice(0, 2).map((r) => (
              <span key={r.kind} className="mr-2 text-zinc-400">
                {r.kind}
              </span>
            ))}
          </div>
          {snap.health.observationalWarnings.length > 0 ? (
            <div className="text-amber-200/80">
              {snap.health.observationalWarnings.slice(0, 3).join(" · ")}
            </div>
          ) : null}
          {(surface?.observationalWarnings?.length ?? 0) > 0 ? (
            <div className="text-amber-200/70">
              {(surface?.observationalWarnings ?? []).slice(0, 2).join(" · ")}
            </div>
          ) : null}
        </div>
      ) : active ? (
        <p className="mt-1 text-zinc-600">Snapshot unavailable (check logs).</p>
      ) : (
        <p className="mt-1 text-zinc-600">Enable FEATURE_FUSION_SYSTEM_V1 + FEATURE_FUSION_SYSTEM_SHADOW_V1.</p>
      )}
    </div>
  );
}
