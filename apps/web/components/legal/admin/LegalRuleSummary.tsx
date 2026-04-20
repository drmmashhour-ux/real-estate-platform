"use client";

export type RuleRow = {
  ruleId: string;
  severity: string;
  message: string;
  impact: string;
};

export function LegalRuleSummary({ rules }: { rules: RuleRow[] }) {
  if (!rules.length) {
    return <p className="text-[11px] text-slate-600">No rule outcomes recorded.</p>;
  }
  return (
    <ul className="space-y-2">
      {rules.map((r) => (
        <li key={r.ruleId} className="rounded border border-slate-800/80 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300">
          <span className="font-mono text-[10px] text-slate-500">{r.ruleId}</span>
          <div className="mt-0.5">
            <span className="text-slate-500">{r.severity}</span>
            {" · "}
            <span className="text-slate-500">{r.impact}</span>
          </div>
          <div className="mt-0.5 text-slate-400">{r.message}</div>
        </li>
      ))}
    </ul>
  );
}
