import type { ReactNode } from "react";
import type { PlatformImprovementBundle } from "@/modules/platform/platform-improvement.types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="mt-2 space-y-2 text-sm text-slate-200">{children}</div>
    </div>
  );
}

export function PlatformImprovementPanel({ bundle }: { bundle: PlatformImprovementBundle }) {
  return (
    <section className="space-y-4" aria-label="Platform improvement review">
      <header className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3">
        <h1 className="text-lg font-semibold text-amber-100">Platform Improvement Review</h1>
        <p className="mt-1 text-xs text-slate-400">
          Advisory structural pass — generated {new Date(bundle.createdAt).toLocaleString()}. Does not change core
          business logic.
        </p>
      </header>

      <Section title="Top priorities">
        <ol className="list-decimal space-y-2 pl-4">
          {bundle.priorities.map((p) => (
            <li key={`${p.category}-${p.title}`}>
              <span className="font-medium text-white">{p.title}</span>
              <span className="ml-2 text-[11px] uppercase text-slate-500">
                {p.category} · {p.urgency}
              </span>
              <p className="mt-0.5 text-slate-400">{p.why}</p>
              <p className="text-xs text-slate-500">Impact: {p.expectedImpact}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Monetization gaps">
        <ul className="list-disc space-y-1 pl-4 text-slate-300">
          {bundle.monetization.highPriorityMonetizationGaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
          {bundle.monetization.highPriorityMonetizationGaps.length === 0 ? (
            <li className="text-slate-500">No high-priority gaps flagged by current rules.</li>
          ) : null}
        </ul>
      </Section>

      <Section title="Trust gaps">
        <ul className="list-disc space-y-1 pl-4 text-slate-300">
          {bundle.trust.coverageGaps.map((g) => (
            <li key={g.patternId}>
              <span className="text-slate-200">{g.patternId}</span>: {g.gap}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Ops simplification">
        <p className="font-medium text-slate-300">Duplicate panels</p>
        <ul className="mb-2 list-disc pl-4 text-slate-400">
          {bundle.ops.duplicatePanels.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="font-medium text-slate-300">Consolidation</p>
        <ul className="list-disc pl-4 text-slate-400">
          {bundle.ops.consolidationSuggestions.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Section>

      <Section title="Data moat opportunities">
        <p className="font-medium text-slate-300">Strongest candidates</p>
        <ul className="list-disc pl-4 text-slate-400">
          {bundle.dataMoat.strongestMoatCandidates.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Section>
    </section>
  );
}
