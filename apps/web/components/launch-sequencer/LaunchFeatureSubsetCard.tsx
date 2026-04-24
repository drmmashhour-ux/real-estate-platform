import type { LaunchFeatureSubset } from "@/modules/launch-sequencer/launch-sequencer.types";

export function LaunchFeatureSubsetCard(props: { subset: LaunchFeatureSubset }) {
  const { subset } = props;
  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-950/15 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-200/80">Feature subset (planning)</p>
      <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-3">
        <div>
          <p className="text-neutral-500">Enabled</p>
          <p className="text-neutral-200">{subset.enabledFeatures.join(", ") || "—"}</p>
        </div>
        <div>
          <p className="text-neutral-500">Restricted</p>
          <p className="text-amber-200/90">{subset.restrictedFeatures.join(", ") || "—"}</p>
        </div>
        <div>
          <p className="text-neutral-500">Blocked</p>
          <p className="text-rose-200/90">{subset.blockedFeatures.join(", ") || "—"}</p>
        </div>
      </div>
      {subset.rationale[0] ? <p className="mt-2 text-[11px] text-neutral-500">{subset.rationale[0]}</p> : null}
    </div>
  );
}
