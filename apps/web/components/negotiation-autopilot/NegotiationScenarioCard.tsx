import type { NegotiationScenario } from "@/modules/negotiation-autopilot/negotiation-autopilot.types";

export function NegotiationScenarioCard({ scenario }: { scenario: NegotiationScenario }) {
  return (
    <article className="rounded-xl border border-ds-border bg-ds-card/50 p-4 shadow-ds-soft">
      <div className="flex flex-wrap justify-between gap-2">
        <h4 className="font-medium text-ds-text">{scenario.title}</h4>
        <span className="text-[10px] uppercase text-ds-text-secondary">{scenario.riskLevel} risk</span>
      </div>
      <p className="mt-2 text-sm text-ds-text-secondary">{scenario.summary}</p>
      <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
        <div>
          <p className="text-ds-gold">Pros</p>
          <ul className="mt-1 list-inside list-disc text-ds-text-secondary">
            {scenario.pros.slice(0, 4).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-ds-gold">Cons / tradeoffs</p>
          <ul className="mt-1 list-inside list-disc text-ds-text-secondary">
            {scenario.cons.slice(0, 4).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
      {scenario.riskNotes.length > 0 ? (
        <p className="mt-3 text-xs text-amber-200/85">Risk: {scenario.riskNotes.join(" · ")}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-ds-text-secondary">Scenario id: {scenario.scenarioId.slice(0, 8)}…</p>
    </article>
  );
}
