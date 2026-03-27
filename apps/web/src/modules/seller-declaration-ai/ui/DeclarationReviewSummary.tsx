type Props = {
  summary: {
    completionPercent: number;
    completedSections: string[];
    missingSections: string[];
    contradictions: string[];
    adminWarnings: string[];
    aiConciseSummary: string;
    recommendedNextActions: string[];
  } | null;
};

export function DeclarationReviewSummary({ summary }: Props) {
  if (!summary) return <p className="text-xs text-slate-500">No review summary yet.</p>;
  return (
    <div className="space-y-2 text-xs">
      <p className="text-slate-200">{summary.aiConciseSummary}</p>
      <p className="text-slate-300">Completed sections: {summary.completedSections.length}</p>
      <p className="text-slate-300">Missing sections: {summary.missingSections.length}</p>
      {summary.contradictions.length ? <p className="text-rose-200">Contradictions: {summary.contradictions.join(" | ")}</p> : null}
      {summary.adminWarnings.length ? <p className="text-amber-200">Warnings: {summary.adminWarnings.join(" | ")}</p> : null}
      <ul className="space-y-1 text-slate-300">
        {summary.recommendedNextActions.map((a) => <li key={a}>- {a}</li>)}
      </ul>
    </div>
  );
}
