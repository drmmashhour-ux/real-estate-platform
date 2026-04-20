import { LegalCaseCard, type LegalCaseCardModel } from "./LegalCaseCard";

export function LegalCaseList({ cases, detailHrefBase }: { cases: LegalCaseCardModel[]; detailHrefBase: string }) {
  if (!cases.length) {
    return <p className="text-sm text-slate-500">No cases loaded.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cases.map((c) => (
        <LegalCaseCard key={c.id} c={c} detailHref={`${detailHrefBase}/${encodeURIComponent(c.id)}`} />
      ))}
    </div>
  );
}
