import type { PolicyDecision } from "@/modules/autonomous-marketplace/types/domain.types";

function previewDisposition(policy: PolicyDecision): string {
  const hint = policy.ruleResults.find((r) => r.ruleCode === "preview_pipeline_disposition");
  return hint?.reason?.replace(/^Preview disposition:\s*/i, "").trim() ?? policy.disposition;
}

export function ListingPreviewPolicyCard({ decisions }: { decisions: PolicyDecision[] }) {
  if (!decisions.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">No policy rows.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {decisions.map((p) => (
        <li key={p.id} className="rounded-lg border border-zinc-800 bg-[#111] p-3 text-xs text-zinc-300">
          <span className="font-mono text-[10px] text-amber-200/80">{p.actionId}</span>
          <p className="mt-1">
            disposition <span className="text-zinc-100">{p.disposition}</span>
          </p>
          <p className="mt-1 text-[10px] text-zinc-500">preview: {previewDisposition(p)}</p>
          <p className="mt-1 text-[10px] text-zinc-600">{p.ruleResults.map((r) => r.ruleCode).join(", ")}</p>
        </li>
      ))}
    </ul>
  );
}
