type KnowledgeHint = {
  content: string;
  sourceTitle: string;
  importance: string;
  pageNumber: number | null;
};

type Props = {
  aiSummary: Record<string, unknown> | null;
  knowledgeRiskHints?: KnowledgeHint[];
};

export function AIInsightsPanel({ aiSummary, knowledgeRiskHints = [] }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">AI insights</p>
      <p className="mt-1 text-xs text-slate-400">Retrieval-grounded excerpts from uploaded law and drafting books — not generated legal advice.</p>
      {knowledgeRiskHints.length ? (
        <ul className="mt-2 space-y-2 text-xs text-slate-200">
          {knowledgeRiskHints.map((h, i) => (
            <li key={`${h.sourceTitle}-${i}`} className="rounded-md bg-white/5 p-2">
              <p className="text-[10px] text-amber-200/90">
                {h.sourceTitle}
                {h.pageNumber != null ? ` · p.${h.pageNumber}` : ""} · {h.importance}
              </p>
              <p className="mt-1 text-slate-300">{h.content}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">
        {aiSummary ? JSON.stringify(aiSummary) : knowledgeRiskHints.length ? null : "No AI summary recorded yet for this document."}
      </p>
    </div>
  );
}
