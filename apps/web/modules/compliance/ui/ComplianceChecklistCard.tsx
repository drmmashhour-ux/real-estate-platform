"use client";

import type { ComplianceRuleResult } from "@/modules/compliance/core/rule-types";

export function ComplianceChecklistCard(props: {
  title: string;
  results: ComplianceRuleResult[];
}) {
  const failed = props.results.filter((r) => !r.passed);
  return (
    <div className="rounded-xl border border-gray-800 bg-black p-4 text-white">
      <h3 className="text-sm font-semibold text-[#D4AF37] mb-2">{props.title}</h3>
      <ul className="space-y-2 text-sm">
        {failed.length === 0 ? (
          <li className="text-emerald-400">All checks passed in this category.</li>
        ) : (
          failed.map((r) => (
            <li key={r.ruleId} className="border-l-2 border-amber-500 pl-2">
              <span className="text-gray-400 text-xs uppercase">{r.severity}</span> — {r.title}: {r.message}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
