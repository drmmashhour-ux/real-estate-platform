export type LegalCaseDetailModel = {
  title: string;
  jurisdiction: string;
  summary: string;
  facts: string;
  legalIssues: string;
  decision: string;
  reasoning: string;
  outcome: string;
};

export function LegalCaseDetail({ c }: { c: LegalCaseDetailModel }) {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-slate-200">
      <header>
        <h2 className="text-lg font-semibold text-white">{c.title}</h2>
        <p className="text-xs text-slate-500">{c.jurisdiction}</p>
      </header>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Summary</h3>
        <p className="mt-1">{c.summary}</p>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Facts</h3>
        <p className="mt-1">{c.facts}</p>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Legal issues</h3>
        <p className="mt-1 whitespace-pre-wrap">{c.legalIssues}</p>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Decision</h3>
        <p className="mt-1">{c.decision}</p>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Reasoning</h3>
        <p className="mt-1">{c.reasoning}</p>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Outcome</h3>
        <p className="mt-1">{c.outcome}</p>
      </section>
    </article>
  );
}
