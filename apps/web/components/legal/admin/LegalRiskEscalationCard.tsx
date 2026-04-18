import type { LegalEscalationAdvice } from "@/modules/legal/legal-escalation.service";

export function LegalRiskEscalationCard({ advice }: { advice: LegalEscalationAdvice | null }) {
  if (!advice) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-xs text-slate-500">No escalation recommendation — queue empty or flags off.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Escalation (advisory)</p>
      <p className="mt-2 text-sm text-slate-200">{advice.recommendation.replace(/_/g, " ")}</p>
      <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
        {advice.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
