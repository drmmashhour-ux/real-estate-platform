import Link from "next/link";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { RESIDENTIAL_EXECUTION_STEPS, resolveCurrentStepFromDealStatus } from "@/modules/deal-execution/execution-orchestrator";
import { getDealPipelineMetrics } from "@/modules/lecipm-analytics/oaciq-pipeline-metrics.service";

export async function OaciqEngineDealPanel({
  dealId,
  locale,
  country,
}: {
  dealId: string;
  locale: string;
  country: string;
}) {
  if (!lecipmOaciqFlags.oaciqFormsEngineV1 && !lecipmOaciqFlags.residentialExecutionPipelineV1) {
    return null;
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { status: true, executionMetadata: true },
  });
  const metrics = await getDealPipelineMetrics(dealId);

  const meta =
    deal?.executionMetadata && typeof deal.executionMetadata === "object"
      ? (deal.executionMetadata as Record<string, unknown>)
      : {};
  const step = (meta.executionStep as string | undefined) ?? resolveCurrentStepFromDealStatus(deal?.status ?? "");

  return (
    <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
      <h3 className="font-medium text-ds-text">OACIQ + execution (Québec residential)</h3>
      <p className="mt-2 text-xs text-ds-text-secondary">
        Specimen registry + uploaded PDF fields only. AI outputs are structured field maps — broker review required before
        any official filing.
      </p>
      <div className="mt-4 grid gap-3 text-sm text-ds-text-secondary md:grid-cols-2">
        <div>
          <p className="text-ds-gold">Assistive step</p>
          <p className="mt-1 capitalize text-ds-text">{step.replace(/_/g, " ")}</p>
        </div>
        <div>
          <p className="text-ds-gold">Negotiation threads (hint)</p>
          <p className="mt-1 text-ds-text">{metrics?.negotiationRoundHint ?? "—"}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1 text-xs text-ds-text-secondary">
        {RESIDENTIAL_EXECUTION_STEPS.map((s) => (
          <li key={s.key}>
            <span className="text-ds-text/80">{s.order}.</span> {s.title}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link className="text-ds-gold hover:text-amber-200" href={`/${locale}/${country}/dashboard/deals/${dealId}/execution`}>
          Execution workspace →
        </Link>
        <span className="text-ds-text-secondary">
          Templates: <code className="text-ds-gold/90">GET /api/forms/templates</code> · Compliance:{" "}
          <code className="text-ds-gold/90">GET /api/compliance/deal/{"{dealId}"}</code>
        </span>
      </div>
    </section>
  );
}
