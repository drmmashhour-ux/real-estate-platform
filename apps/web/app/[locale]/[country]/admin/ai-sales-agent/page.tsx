import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getAiSalesAgentConfig } from "@/modules/ai-sales-agent/ai-sales-config.service";
import { getAiSalesAgentMetrics } from "@/modules/ai-sales-agent/ai-sales-learning.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AiSalesAgentAdminPage() {
  await requireAdminControlUserId();

  const [metrics, cfg] = await Promise.all([getAiSalesAgentMetrics(), getAiSalesAgentConfig()]);
  const ffOn =
    process.env.FEATURE_AI_SALES_AGENT_V1 === "true" || process.env.FEATURE_AI_SALES_AGENT_V1 === "1";

  return (
    <LecipmControlShell showSearch={false}>
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">LECIPM Centris stack</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">AI Sales Agent</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Automated assistant identity (never a human broker); escalates HOT leads and visit intents to listing
            brokers. Respect marketing consent and unsubscribes — timeline events provide the audit trail.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">FEATURE_AI_SALES_AGENT_V1</dt>
              <dd className="mt-1 font-medium text-zinc-100">{ffOn ? "On" : "Off"}</dd>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Effective mode</dt>
              <dd className="mt-1 font-medium text-amber-200/90">{metrics.mode}</dd>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Own nurture sequence</dt>
              <dd className="mt-1 font-medium text-zinc-100">{cfg.ownSequence ? "Yes (Centris domination paused)" : "No"}</dd>
            </div>
          </dl>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
          <h2 className="text-lg font-semibold text-white">Last 30 days</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Triggers" value={metrics.leadsTouched30d} />
            <Metric label="Messages logged" value={metrics.messagesSent30d} />
            <Metric label="Broker escalations" value={metrics.escalations30d} />
            <Metric label="Visit requests recorded" value={metrics.bookingsRecorded30d} />
            <Metric label="Sequence jobs completed" value={metrics.sequenceJobsCompleted30d} />
            <Metric
              label="Approx. conversion (bookings / triggers)"
              value={metrics.conversionRateApprox != null ? `${(metrics.conversionRateApprox * 100).toFixed(1)}%` : "—"}
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-400">
          <h2 className="text-lg font-semibold text-white">Controls</h2>
          <p className="mt-2">
            Mode and <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">ownSequence</code> live in{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">AiFollowUpSettings.templatesJson.aiSalesAgent</code>
            — patch via <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">PATCH /api/admin/ai-sales-agent</code>.
            Cron: <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">POST /api/cron/ai-sales-sequence</code>.
          </p>
        </section>
      </div>
    </LecipmControlShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-black/30 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}
