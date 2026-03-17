"use client";

type Rule = {
  id: string;
  key: string;
  name: string;
  ruleType: string;
  effect: string;
  version: number;
  active: boolean;
};
type Log = {
  id: string;
  ruleKey: string;
  entityType: string;
  entityId: string;
  decision: string;
  reasonCode: string | null;
  evaluatedAt: string | Date;
};

export function PoliciesDashboardClient({
  initialRules,
  initialDecisionLog,
}: {
  initialRules: Rule[];
  initialDecisionLog: Log[];
}) {
  return (
    <div className="mt-6 space-y-8">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Active policy rules</h2>
        <p className="mt-1 text-sm text-slate-500">Eligibility, visibility, payout release, review eligibility, etc.</p>
        <ul className="mt-4 space-y-2">
          {initialRules.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-sm">
              <span className="font-mono font-medium text-slate-300">{r.key}</span>
              <span className="text-slate-500">{r.name}</span>
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">{r.ruleType}</span>
              <span className={`rounded px-1.5 py-0.5 text-xs ${r.effect === "ALLOW" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                {r.effect}
              </span>
              <span className="text-xs text-slate-500">v{r.version}</span>
            </li>
          ))}
          {initialRules.length === 0 && (
            <li className="text-sm text-slate-500">No rules. POST /api/admin/policies with default rules or run ensureDefaultPolicies().</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Policy decision log (recent)</h2>
        <p className="mt-1 text-sm text-slate-500">Audit trail for rule evaluation.</p>
        <ul className="mt-4 space-y-1 text-sm">
          {initialDecisionLog.slice(0, 20).map((d) => (
            <li key={d.id} className="flex flex-wrap gap-2 text-slate-400">
              <span className="text-slate-500">{new Date(d.evaluatedAt as string).toLocaleString()}</span>
              <span className="font-mono text-slate-300">{d.ruleKey}</span>
              <span>{d.entityType}:{d.entityId.slice(0, 8)}…</span>
              <span className={d.decision === "ALLOWED" ? "text-emerald-400" : "text-amber-400"}>{d.decision}</span>
              {d.reasonCode && <span className="text-slate-500">({d.reasonCode})</span>}
            </li>
          ))}
          {initialDecisionLog.length === 0 && <li className="text-slate-500">No decisions yet.</li>}
        </ul>
      </section>
    </div>
  );
}
