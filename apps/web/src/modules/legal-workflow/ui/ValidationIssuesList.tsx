type Props = {
  issues: {
    missingFields: string[];
    warnings: string[];
    contradictions: string[];
    knowledgeRuleBlocks?: string[];
  };
};

export function ValidationIssuesList({ issues }: Props) {
  const blocks = issues.knowledgeRuleBlocks ?? [];
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Validation issues</p>
      <div className="mt-2 space-y-1 text-xs">
        {blocks.length ? (
          <p className="text-rose-200">Blocking (rules): {blocks.join(" | ")}</p>
        ) : null}
        {issues.missingFields.length ? <p className="text-amber-200">Missing: {issues.missingFields.join(", ")}</p> : <p className="text-emerald-200">No required fields missing.</p>}
        {issues.warnings.length ? <p className="text-amber-100">Warnings: {issues.warnings.join(" | ")}</p> : null}
        {issues.contradictions.length ? <p className="text-rose-200">Contradictions: {issues.contradictions.join(" | ")}</p> : <p className="text-emerald-200">No contradictions.</p>}
      </div>
    </div>
  );
}
