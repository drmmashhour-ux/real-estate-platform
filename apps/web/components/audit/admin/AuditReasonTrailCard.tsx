import type { AuditReasonTrailStep } from "@/modules/audit/audit-panel.service";

export function AuditReasonTrailCard({ trail }: { trail: AuditReasonTrailStep[] }) {
  if (!trail.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">No reason trail.</p>
    );
  }

  return (
    <ol className="list-decimal space-y-2 pl-5 text-xs text-zinc-400">
      {trail.map((t, i) => (
        <li key={`${t.sortKey}-${i}`}>
          <span className="font-mono text-[10px] text-zinc-600">[{t.source}]</span> {t.label}: {t.detail}
        </li>
      ))}
    </ol>
  );
}
