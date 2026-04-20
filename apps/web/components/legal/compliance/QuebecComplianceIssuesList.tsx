"use client";

type Issue = { id: string; label: string; passed: boolean; severity: "info" | "warning" | "critical"; blocking: boolean };

export function QuebecComplianceIssuesList({ issues }: { issues: readonly Issue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="mt-3 space-y-2 text-sm text-slate-200">
      {issues.map((row) => (
        <li
          key={row.id}
          className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 ${
            row.passed ? "border-emerald-500/25 bg-emerald-500/5" : "border-white/10 bg-black/20"
          }`}
        >
          <div>
            <p className="font-medium text-white">{row.label}</p>
            <p className="text-xs text-slate-400">
              {row.severity} · {row.blocking ? "required for publish" : "advisory"}
            </p>
          </div>
          <span className={`text-xs font-semibold uppercase ${row.passed ? "text-emerald-300" : "text-amber-200"}`}>
            {row.passed ? "OK" : "Needs attention"}
          </span>
        </li>
      ))}
    </ul>
  );
}
