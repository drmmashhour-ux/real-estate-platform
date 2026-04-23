type Props = {
  working: readonly string[];
  blocked: readonly string[];
  needsHumanReview: readonly string[];
  thresholdHints: readonly string[];
};

export function DarlinkAutonomyOptimizationCard(props: Props) {
  const sections: { title: string; items: readonly string[] }[] = [
    { title: "Working", items: props.working },
    { title: "Blocked / gated", items: props.blocked },
    { title: "Needs human review", items: props.needsHumanReview },
    { title: "Threshold tuning hints", items: props.thresholdHints },
  ];
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-emerald-950">Optimization lens</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900/70">{s.title}</p>
            <ul className="mt-1 list-inside list-disc text-sm text-emerald-950/90">
              {s.items.length === 0 ? <li className="text-emerald-800/60">—</li> : s.items.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-emerald-900/70">Recommendation-only — no auto-apply in this phase.</p>
    </section>
  );
}
