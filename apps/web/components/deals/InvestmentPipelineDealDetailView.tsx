import Link from "next/link";
import type { PipelineDealDetail } from "@/modules/deals/deal-pipeline.service";
import { UnderwritingPanel } from "./UnderwritingPanel";

export function InvestmentPipelineDealDetailView({
  localePrefix,
  deal,
}: {
  localePrefix: string;
  deal: PipelineDealDetail;
}) {
  const listingId = deal.listingId;

  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6 text-zinc-100">
      <div>
        <Link href={`${localePrefix}/dashboard/deals`} className="text-sm text-amber-400 hover:text-amber-300">
          ← Deal pipeline
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl">{deal.title}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Stage <span className="text-zinc-200">{deal.pipelineStage}</span> · Status{" "}
              <span className="text-zinc-200">{deal.status}</span>
              {deal.decisionStatus ?
                <>
                  {" "}
                  · Decision <span className="text-zinc-200">{deal.decisionStatus}</span>
                </>
              : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {listingId ?
              <>
                <Link
                  href={`${localePrefix}/dashboard/investor/memo/${listingId}`}
                  className="rounded border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-900"
                >
                  Investor memo
                </Link>
                <Link
                  href={`${localePrefix}/dashboard/investor/ic-pack/${listingId}`}
                  className="rounded border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-900"
                >
                  IC pack
                </Link>
              </>
            : null}
          </div>
        </div>
      </div>

      <UnderwritingPanel 
        dealId={deal.id} 
        initialUnderwriting={{
          underwritingScore: deal.underwritingScore,
          underwritingLabel: deal.underwritingLabel,
          underwritingRecommendation: deal.underwritingRecommendation,
          underwritingConfidence: deal.underwritingConfidence,
          underwritingSummaryJson: deal.underwritingSummaryJson,
          underwritingRisksJson: deal.underwritingRisksJson,
          underwritingUpsideJson: deal.underwritingUpsideJson,
          underwritingUpdatedAt: deal.underwritingUpdatedAt,
        }} 
      />

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Linked asset</h2>
        {deal.listing ?
          <p className="mt-2 text-sm text-zinc-400">
            {deal.listing.title}{" "}
            <span className="text-zinc-500">({deal.listing.listingCode})</span> · Ask $
            {deal.listing.price.toLocaleString()}
          </p>
        : <p className="mt-2 text-sm text-zinc-500">No CRM listing linked — standalone deal.</p>}
        <div className="mt-3 text-xs text-zinc-500">
          Latest memo: {deal.latestMemo ? deal.latestMemo.title : "—"} · IC pack:{" "}
          {deal.latestIcPack ? deal.latestIcPack.title : "—"}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Stage timeline</h2>
        <ol className="space-y-2 border-l border-zinc-800 pl-4">
          {deal.stageHistories.map((h) => (
            <li key={h.id} className="text-sm text-zinc-400">
              <span className="text-zinc-200">{h.toStage}</span>
              {h.fromStage ? ` ← ${h.fromStage}` : ""}
              <span className="ml-2 text-xs text-zinc-600">{new Date(h.createdAt).toLocaleString()}</span>
              {h.reason ?
                <span className="mt-1 block text-xs text-zinc-500">{h.reason}</span>
              : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Committee</h2>
          <h3 className="text-xs uppercase text-zinc-500">Submissions</h3>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {deal.committeeSubmissions.map((s) => (
              <li key={s.id}>
                {s.submissionStatus} · {new Date(s.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 text-xs uppercase text-zinc-500">Decisions</h3>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {deal.committeeDecisions.map((c) => (
              <li key={c.id}>
                <strong className="text-zinc-200">{c.recommendation}</strong> — {c.rationale.slice(0, 160)}…
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Conditions</h2>
          <ul className="space-y-2 text-sm">
            {deal.conditions.map((c) => (
              <li key={c.id} className="rounded border border-zinc-800 px-3 py-2 text-zinc-400">
                <span className="text-zinc-200">{c.title}</span> · {c.status} · {c.priority ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Diligence</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          {deal.diligenceTasks.map((t) => (
            <li key={t.id}>
              {t.title} · {t.status} · {t.category}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Follow-ups</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          {deal.followUps.map((f) => (
            <li key={f.id}>
              {f.title} · {f.status} · {f.followUpType}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">Audit trail</h2>
        <ul className="max-h-80 space-y-2 overflow-y-auto text-xs text-zinc-500">
          {deal.audits.map((a) => (
            <li key={a.id}>
              <span className="text-zinc-400">{a.eventType}</span> · {new Date(a.createdAt).toLocaleString()}
              {a.note ?
                <span className="ml-2">{a.note.slice(0, 200)}</span>
              : null}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-zinc-600">
        APIs: <code className="text-zinc-500">/api/deals/pipeline/&lt;dealId&gt;/…</code> for stage, committee,
        conditions, diligence, follow-ups. Summary: <code className="text-zinc-500">GET /api/deals/pipeline/summary</code>
        .
      </p>
    </main>
  );
}
