import type { Metadata } from "next";
import Link from "next/link";
import { CommandCenterAiRefreshButton } from "@/components/command-center/CommandCenterAiRefreshButton";
import { CommandCenterTrackedLink } from "@/components/command-center/CommandCenterTrackedLink";
import { LaunchSequencerSummaryStrip } from "@/components/launch-sequencer/LaunchSequencerSummaryStrip";
import { CorporateStrategyCommandStrip } from "@/components/corporate-strategy/CorporateStrategyCommandStrip";
import { InvestorIntelligenceCommandStrip } from "@/components/investor/InvestorIntelligenceCommandStrip";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { buildCommandCenterAiPayload, getLatestCommandCenterSnapshotMeta } from "@/modules/command-center/command-center-ai.service";
import { prisma } from "@repo/db";

export const metadata: Metadata = {
  title: "AI Command Cockpit",
  description: "LECIPM executive surface — opportunities, risk, signatures, execution, capital, finance, and explainable next actions.",
};

export const dynamic = "force-dynamic";

const card =
  "rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_40px_rgb(0_0_0_/_0.35)]";
const h2 = "text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/90";
const btnPrimary =
  "inline-flex items-center justify-center rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-semibold text-[#f4efe4] hover:bg-[#D4AF37]/25";

export default async function CommandCenterAiPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return null;
  if (user.role !== "BROKER" && user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#050505] px-4 py-16 text-center text-neutral-300">
        <p>Broker or administrator access is required for the AI Command Cockpit.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-[#D4AF37] hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const [payload, lastSnap] = await Promise.all([
    buildCommandCenterAiPayload(userId, user.role),
    getLatestCommandCenterSnapshotMeta(userId),
  ]);

  const { context, priorities, alerts, recommendations } = payload;
  const k = context.legacy.summary.executive;
  const urgentAlerts = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH").slice(0, 6);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-[#f4efe4] md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/80">LECIPM · BNHub</p>
            <h1 className="mt-2 font-serif text-3xl text-[#f4efe4] md:text-4xl">AI Command Cockpit</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              Visibility and orchestration only — nothing legally binding runs without your review and signature. Recommendations include explicit reasoning for every
              suggestion.
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Generated {new Date(context.generatedAt).toLocaleString()}
              {lastSnap ? ` · Last persisted snapshot ${new Date(lastSnap.generatedAt).toLocaleString()}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <CommandCenterAiRefreshButton />
            <Link href="/dashboard/lecipm" className="text-xs text-[#D4AF37]/80 hover:text-[#D4AF37]">
              Classic command center →
            </Link>
          </div>
        </header>

        <LaunchSequencerSummaryStrip dashboardHref="/dashboard/launch-sequencer" />

        <div className="md:max-w-3xl space-y-3">
          <InvestorIntelligenceCommandStrip />
          <CorporateStrategyCommandStrip />
        </div>

        {/* 1 Executive overview */}
        <section className="space-y-3">
          <h2 className={h2}>Executive overview</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <div className={card}>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Revenue signal</p>
              <p className="mt-1 text-xl font-semibold">{k.revenueDisplay}</p>
            </div>
            <div className={card}>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Active deals</p>
              <p className="mt-1 text-xl font-semibold">{k.activeDeals}</p>
            </div>
            <div className={card}>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Trust</p>
              <p className="mt-1 text-xl font-semibold">{k.trustScore ?? "—"}</p>
            </div>
            <div className={card}>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Automation</p>
              <p className="mt-1 text-xl font-semibold">{k.automationDisplay}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={card}>
              <p className="text-sm font-medium text-[#f4efe4]">Act now</p>
              <ul className="mt-2 space-y-2 text-sm text-neutral-300">
                {priorities.ACT_NOW.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    {p.href ?
                      <CommandCenterTrackedLink href={p.href} actionKey="priority_act_now" label={p.title} className="text-[#D4AF37] hover:underline">
                        {p.title}
                      </CommandCenterTrackedLink>
                    : p.title}
                    {p.detail ? <span className="block text-xs text-neutral-500">{p.detail}</span> : null}
                  </li>
                ))}
                {priorities.ACT_NOW.length === 0 ? <li className="text-neutral-500">No critical broker gates right now.</li> : null}
              </ul>
            </div>
            <div className={card}>
              <p className="text-sm font-medium text-[#f4efe4]">Urgent alerts</p>
              <ul className="mt-2 space-y-2 text-sm">
                {urgentAlerts.map((a) => (
                  <li key={`${a.type}-${a.entityId}`} className="text-neutral-300">
                    <span className="font-medium text-amber-200/90">{a.severity}</span> — {a.title}
                    {a.actionUrl ?
                      <CommandCenterTrackedLink
                        href={a.actionUrl}
                        actionKey="alert_open"
                        label={a.title}
                        className={`${btnPrimary} mt-1 inline-flex`}
                      >
                        {a.actionLabel ?? "Open"}
                      </CommandCenterTrackedLink>
                    : null}
                  </li>
                ))}
                {urgentAlerts.length === 0 ? <li className="text-neutral-500">No CRITICAL/HIGH alerts from the current engine pass.</li> : null}
              </ul>
            </div>
          </div>
        </section>

        {/* 2 Needs your signature */}
        <section className="space-y-3">
          <h2 className={h2}>Needs your signature</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {context.signatureQueue.slice(0, 9).map((s) => (
              <div key={`${s.kind}-${s.id}`} className={card}>
                <p className="text-[10px] uppercase text-neutral-500">{s.kind.replace(/_/g, " ")}</p>
                <p className="mt-1 text-sm font-medium leading-snug">{s.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <CommandCenterTrackedLink href={s.href} actionKey="approve_sign" label={s.title} className={btnPrimary}>
                    Open for review
                  </CommandCenterTrackedLink>
                  <CommandCenterTrackedLink href="/dashboard/signature-center" actionKey="signature_center" label="Signature center" className={btnPrimary}>
                    Approve & sign
                  </CommandCenterTrackedLink>
                </div>
              </div>
            ))}
            {context.signatureQueue.length === 0 ?
              <p className="text-sm text-neutral-500">No items in the signature queue for this scope.</p>
            : null}
          </div>
        </section>

        {/* 3 Hot opportunities */}
        <section className="space-y-3">
          <h2 className={h2}>Hot opportunities</h2>
          <div className="flex flex-wrap gap-2">
            {context.hotOpportunities.slice(0, 12).map((o) => (
              <CommandCenterTrackedLink
                key={`${o.kind}-${o.id}`}
                href={o.href}
                actionKey="hot_opportunity"
                label={o.label}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-neutral-200 hover:border-[#D4AF37]/35"
              >
                {o.label}
              </CommandCenterTrackedLink>
            ))}
          </div>
        </section>

        {/* 4 Active execution */}
        <section className="space-y-3">
          <h2 className={h2}>Active execution (AI visibility)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={card}>
              <p className="text-sm font-medium text-emerald-200/90">AI already handled</p>
              <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm text-neutral-300">
                {context.execution.aiHandled.map((x) => (
                  <li key={x.id}>
                    {x.href ?
                      <CommandCenterTrackedLink href={x.href} actionKey="execution_ai" label={x.title} className="hover:text-[#D4AF37]">
                        {x.title}
                      </CommandCenterTrackedLink>
                    : x.title}
                  </li>
                ))}
                {context.execution.aiHandled.length === 0 ? <li className="text-neutral-500">No recent executed autopilot rows.</li> : null}
              </ul>
            </div>
            <div className={card}>
              <p className="text-sm font-medium text-amber-200/90">Draft / blocked / retry</p>
              <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm text-neutral-300">
                {context.execution.failedOrBlocked.map((x) => (
                  <li key={x.id}>
                    <span className="text-neutral-400">{x.status}</span> — {x.title}
                    {x.blockedReason ? <span className="block text-xs text-neutral-500">{x.blockedReason}</span> : null}
                    {x.href ?
                      <CommandCenterTrackedLink href={x.href} actionKey="execution_retry" label={x.title} className="mt-1 inline-block text-xs text-[#D4AF37]">
                        Open autopilot
                      </CommandCenterTrackedLink>
                    : null}
                  </li>
                ))}
                {context.execution.failedOrBlocked.length === 0 ? <li className="text-neutral-500">No draft AI actions in prep.</li> : null}
              </ul>
            </div>
          </div>
        </section>

        {/* 5 Deals & closings */}
        <section className="space-y-3">
          <h2 className={h2}>Deals & closings</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Deal</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Score / P(close)</th>
                  <th className="px-3 py-2">Blocker</th>
                  <th className="px-3 py-2">Signature</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {context.deals.slice(0, 14).map((d) => (
                  <tr key={d.dealId} className="border-b border-white/5 text-neutral-300">
                    <td className="px-3 py-2 font-medium text-[#f4efe4]">{d.dealCode ?? d.dealId.slice(0, 8)}</td>
                    <td className="px-3 py-2">{d.stage}</td>
                    <td className="px-3 py-2">
                      {d.dealScore ?? "—"} / {d.closeProbability != null ? `${Math.round(d.closeProbability * 100)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-neutral-400">{d.blocker ?? "—"}</td>
                    <td className="px-3 py-2">{d.needsBrokerSignature ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">
                      <CommandCenterTrackedLink href={d.href} actionKey="open_deal" label={d.dealCode ?? d.dealId} className="text-xs text-[#D4AF37] hover:underline">
                        Open
                      </CommandCenterTrackedLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {context.closings.slice(0, 8).map((c) => (
              <div key={c.dealId} className={card}>
                <p className="text-sm font-medium">Closing · {c.dealId.slice(0, 8)}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Status {c.closingStatus ?? "—"} · Readiness {c.readiness ?? "—"}
                  {c.closingDate ? ` · Signing ${c.closingDate.slice(0, 10)}` : ""}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  Pending signatures: {c.pendingSignatures} · Open checklist: {c.openChecklist} · Blocked: {c.blockedChecklist}
                </p>
                <CommandCenterTrackedLink href={c.href} actionKey="open_closing" className={`${btnPrimary} mt-3`}>
                  Open deal / closing
                </CommandCenterTrackedLink>
              </div>
            ))}
            {context.closings.length === 0 ? <p className="text-sm text-neutral-500">No active closing rooms in scope.</p> : null}
          </div>
        </section>

        {/* 6 Investors & capital */}
        <section className="space-y-3">
          <h2 className={h2}>Investors & capital</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {context.investors.slice(0, 8).map((inv) => (
              <div key={inv.id} className={card}>
                <p className="text-sm font-medium">{inv.title}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {inv.stage} · {inv.decisionStatus}
                </p>
                <CommandCenterTrackedLink href={inv.href} actionKey="open_investor" className={`${btnPrimary} mt-3`}>
                  Open investor desk
                </CommandCenterTrackedLink>
              </div>
            ))}
            {context.investors.length === 0 ? <p className="text-sm text-neutral-500">No investor pipeline rows for this broker scope.</p> : null}
          </div>
        </section>

        {/* 7 Finance & compliance */}
        <section className="space-y-3">
          <h2 className={h2}>Finance & compliance</h2>
          <div className={card}>
            <p className="text-sm text-neutral-300">
              Open invoices: {context.finance.invoicesOpen} · Overdue: {context.finance.invoicesOverdue}
            </p>
            <p className="mt-2 text-xs text-neutral-500">{context.finance.taxHint}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {context.finance.recentInvoices.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 text-neutral-300">
                  <span>
                    {inv.invoiceNumber} · {inv.status}
                  </span>
                  <CommandCenterTrackedLink href={inv.href} actionKey="review_invoice" className="text-xs text-[#D4AF37] hover:underline">
                    Review
                  </CommandCenterTrackedLink>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <CommandCenterTrackedLink href="/dashboard/broker/financial/revenu-quebec" actionKey="tax_hub" className={btnPrimary}>
                Tax hub
              </CommandCenterTrackedLink>
              <CommandCenterTrackedLink href="/dashboard/broker/compliance" actionKey="compliance" className={btnPrimary}>
                Compliance
              </CommandCenterTrackedLink>
            </div>
          </div>
        </section>

        {/* 8 Recommendations */}
        <section className="space-y-3">
          <h2 className={h2}>Recommendations (explainable)</h2>
          <div className="space-y-3">
            {recommendations.slice(0, 12).map((r) => (
              <div key={`${r.category}-${r.entityType}-${r.entityId}`} className={card}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#f4efe4]">
                    <span className="text-[#D4AF37]">{r.category}</span> · score {r.score.toFixed(1)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-neutral-200">{r.reasoningJson.why}</p>
                <p className="mt-1 text-xs text-emerald-200/80">Impact: {r.reasoningJson.expectedImpact}</p>
                <p className="mt-1 text-xs text-amber-200/80">Risk / blocker: {r.reasoningJson.riskOrBlocker}</p>
                <ul className="mt-2 list-inside list-disc text-xs text-neutral-500">
                  {r.reasoningJson.explainability.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 pt-6 text-center text-xs text-neutral-600">
          Learning loop: persist snapshots to attach recommendation IDs for acted tracking. Quick actions log <code className="text-neutral-500">command-center:quick_action_used</code>{" "}
          for CEO / memory evolution.
        </footer>
      </div>
    </div>
  );
}
