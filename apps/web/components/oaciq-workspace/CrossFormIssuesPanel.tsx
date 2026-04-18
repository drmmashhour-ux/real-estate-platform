"use client";

import { ValidationBadge } from "@/components/oaciq-forms/ValidationBadge";

type Issue = { severity: "info" | "warning" | "critical"; code: string; message: string; formKey?: string };

export function CrossFormIssuesPanel({ issues }: { issues: Issue[] }) {
  if (!issues.length) {
    return <p className="text-xs text-ds-text-secondary">No cross-document issues reported.</p>;
  }
  return (
    <ul className="space-y-2">
      {issues.map((i, idx) => (
        <li key={`${i.code}-${idx}`} className="flex flex-wrap items-start gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">
          <ValidationBadge severity={i.severity} />
          <span className="text-ds-text-secondary">{i.message}</span>
          {i.formKey ? <span className="font-mono text-[10px] text-ds-gold/80">{i.formKey}</span> : null}
        </li>
      ))}
    </ul>
  );
}
