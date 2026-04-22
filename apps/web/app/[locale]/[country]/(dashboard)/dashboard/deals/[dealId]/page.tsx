import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  canAccessPipelineDeal,
  canRecordCommitteeDecision,
} from "@/modules/deals/deal-policy";
import {
  buildDealSummary,
  getDealById,
} from "@/modules/deals/deal.service";
import { listConditions } from "@/modules/deals/deal-conditions.service";
import { listTasks } from "@/modules/deals/deal-diligence.service";

export const dynamic = "force-dynamic";

export default async function PipelineDealDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; dealId: string }>;
}) {
  const { locale, country, dealId } = await params;
  const base = `/${locale}/${country}/dashboard/deals`;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN" && user.role !== "INVESTOR")) {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const deal = await getDealById(dealId);
  if (!deal) notFound();

  const allowed =
    canAccessPipelineDeal(user.role, userId, deal) || canRecordCommitteeDecision(user.role);
  if (!allowed) redirect(base);

  const [summary, conditions, tasks] = await Promise.all([
    buildDealSummary(dealId),
    listConditions(dealId),
    listTasks(dealId),
  ]);

  if (!summary) notFound();

  return (
    <div className="space-y-6 p-4 text-sm">
      <div>
        <Link className="text-primary underline" href={base}>
          ← Deals
        </Link>
      </div>

      <section>
        <h1 className="text-lg font-semibold font-mono">{deal.dealNumber}</h1>
        <p>{deal.title}</p>
        <p className="text-muted-foreground">
          Stage: {deal.pipelineStage} · Decision: {deal.decisionStatus}
        </p>
        <p className="text-muted-foreground">
          Readiness: <span className="font-medium">{summary.readinessLabel}</span>
        </p>
        <p className="flex flex-wrap gap-3">
          <Link className="text-primary underline" href={`/${locale}/${country}/dashboard/deals/${dealId}/capital`}>
            Capital & financing →
          </Link>
          <Link className="text-primary underline" href={`/${locale}/${country}/dashboard/deals/${dealId}/closing`}>
            Closing room →
          </Link>
        </p>
        <p className="text-muted-foreground">
          Linked TX: {deal.latestTransactionNumber ?? deal.transaction?.transactionNumber ?? "—"}
        </p>
        {summary.blockers.length > 0 ?
          <ul className="mt-2 list-inside list-disc text-destructive">
            {summary.blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        : null}
      </section>

      <section>
        <h2 className="font-medium">Stage history</h2>
        <ul className="mt-1 space-y-1 text-xs">
          {summary.stageHistory.map((h) => (
            <li key={h.id}>
              {h.createdAt.toISOString().slice(0, 16)} · {h.fromStage ?? "∅"} → {h.toStage}
              {h.reason ? ` — ${h.reason.slice(0, 120)}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Committee</h2>
        {summary.latestCommitteeDecision ?
          <div className="text-xs">
            <p>
              Latest: {summary.latestCommitteeDecision.recommendation} (
              {summary.latestCommitteeDecision.confidenceLevel ?? "n/a"})
            </p>
            <p className="text-muted-foreground">{summary.latestCommitteeDecision.rationale.slice(0, 400)}</p>
          </div>
        : <p className="text-muted-foreground">No decision recorded.</p>}
      </section>

      <section>
        <h2 className="font-medium">Conditions</h2>
        <ul className="mt-1 space-y-1">
          {conditions.map((c) => (
            <li key={c.id} className="text-xs">
              <span className="font-medium">{c.priority}</span> · {c.status} · {c.title}
              {c.dueDate ? ` · due ${c.dueDate.toISOString().slice(0, 10)}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Diligence tasks</h2>
        <ul className="mt-1 space-y-1">
          {tasks.map((t) => (
            <li key={t.id} className="text-xs">
              {t.status} · {t.title}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Audit (latest)</h2>
        <ul className="mt-1 max-h-48 space-y-1 overflow-auto text-xs">
          {summary.auditEvents.map((a) => (
            <li key={a.id}>
              {a.createdAt.toISOString().slice(0, 16)} · {a.eventType} — {a.summary.slice(0, 120)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
