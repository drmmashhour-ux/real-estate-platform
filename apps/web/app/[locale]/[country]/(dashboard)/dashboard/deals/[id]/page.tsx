import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { InvestmentPipelineDealDetailView } from "@/components/deals/InvestmentPipelineDealDetailView";
import { getPipelineDealDetail } from "@/modules/deals/deal-pipeline.service";
import { userCanViewPipelineDeal } from "@/modules/deals/deal-access";
import { isStripeConfigured } from "@/lib/stripe";
import { DealDetailClient } from "./deal-detail-client";
import { DealLegalTimelineClient } from "./deal-legal-timeline-client";
import { getDealLegalTimeline } from "@/lib/deals/legal-timeline";
import { DealReviewSurfaceSection } from "@/components/review-integration/DealReviewSurfaceSection";
import { getDealReviewSurfaceForViewer } from "@/modules/qa-review/review-surface.service";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import {
  getDealConflictDisclosureSurface,
  refreshDealConflictComplianceState,
} from "@/lib/compliance/conflict-deal-compliance.service";
import { DealConflictDisclosureClient } from "@/components/deals/DealConflictDisclosureClient";
import { BrokerAssistantQuickLinks } from "@/components/broker-assistant/BrokerAssistantQuickLinks";
import { DealCloserPanel } from "@/components/deals/DealCloserPanel";
import { OfferStrategyPanel } from "@/components/deals/OfferStrategyPanel";
import { NegotiationSimulatorPanel } from "@/components/deals/NegotiationSimulatorPanel";
import { BrokerMandatoryDisclosureStatus } from "@/components/compliance/BrokerMandatoryDisclosureStatus";
import { getBrokerDisclosureStatusForDeal, mandatoryBrokerDisclosureEnforced } from "@/lib/compliance/oaciq/broker-mandatory-disclosure.service";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  initiated: "Initiated",
  offer_submitted: "Offer submitted",
  accepted: "Accepted",
  inspection: "Inspection",
  financing: "Financing",
  closing_scheduled: "Closing scheduled",
  closed: "Closed",
  cancelled: "Cancelled",
  CONFLICT_REQUIRES_DISCLOSURE: "Disclosure required (broker conflict)",
};

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) notFound();
  const { locale, country, id } = await params;
  const localePrefix = `/${locale}/${country}`;

  const pipelineRow = await prisma.investmentPipelineDeal.findUnique({
    where: { id },
    select: { id: true },
  });
  if (pipelineRow && (await userCanViewPipelineDeal(userId, id))) {
    const pd = await getPipelineDealDetail(id);
    if (pd) return <InvestmentPipelineDealDetailView localePrefix={localePrefix} deal={pd} />;
  }

  let deal = await prisma.deal.findFirst({
    where: {
      id,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, contactOrigin: true, commissionSource: true, firstPlatformContactAt: true } },
      milestones: true,
      documents: true,
      payments: true,
    },
  });
  if (!deal) notFound();

  if (lecipmOaciqFlags.brokerConflictDisclosureV1) {
    await refreshDealConflictComplianceState(deal.id);
    const refreshed = await prisma.deal.findFirst({
      where: {
        id,
        OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, contactOrigin: true, commissionSource: true, firstPlatformContactAt: true } },
        milestones: true,
        documents: true,
        payments: true,
      },
    });
    if (refreshed) deal = refreshed;
  }

  const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const legalTimeline = await getDealLegalTimeline(deal.id);
  const canEditLegalTimeline = viewer?.role === "ADMIN" || viewer?.role === "BROKER" || deal.brokerId === userId;
  const reviewSurface =
    viewer?.role != null
      ? await getDealReviewSurfaceForViewer({
          dealId: id,
          viewerUserId: userId,
          viewerRole: viewer.role,
        })
      : { enabled: false as const };

  const conflictSurface =
    lecipmOaciqFlags.brokerConflictDisclosureV1
      ? await getDealConflictDisclosureSurface(id, userId)
      : null;

  const mandatoryDisclosure = await getBrokerDisclosureStatusForDeal(id);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href={`${localePrefix}/dashboard/deals`} className="text-sm text-amber-400 hover:text-amber-300">
          ← Closing / pipeline hub
        </Link>
        <p className="mt-3 flex flex-wrap gap-4">
          <Link
            href={`${localePrefix}/dashboard/deals/${id}/coordination`}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Coordination hub →
          </Link>
          <Link
            href={`${localePrefix}/dashboard/deals/${id}/execution`}
            className="text-sm font-medium text-amber-400 hover:text-amber-300"
          >
            Execution &amp; document copilot →
          </Link>
        </p>
        <h1 className="mt-4 text-2xl font-semibold">Deal</h1>
        <p className="mt-1 text-slate-400">
          Status: {STATUS_LABELS[deal.status] ?? deal.status} · ${(deal.priceCents / 100).toLocaleString()}
        </p>

        {(viewer?.role === "ADMIN" || (viewer?.role === "BROKER" && deal.brokerId === userId)) && (
          <div className="mt-4">
            <BrokerAssistantQuickLinks crmDealId={id} />
          </div>
        )}

        {(viewer?.role === "ADMIN" || (viewer?.role === "BROKER" && deal.brokerId === userId)) && (
          <div className="mt-4">
            <DealCloserPanel dealId={id} enabled />
          </div>
        )}

        {(viewer?.role === "ADMIN" || (viewer?.role === "BROKER" && deal.brokerId === userId)) && (
          <div className="mt-4">
            <OfferStrategyPanel dealId={id} enabled />
          </div>
        )}

        {(viewer?.role === "ADMIN" || (viewer?.role === "BROKER" && deal.brokerId === userId)) && (
          <div className="mt-4">
            <NegotiationSimulatorPanel dealId={id} enabled />
          </div>
        )}

        <DealReviewSurfaceSection surface={reviewSurface} />

        {conflictSurface ? (
          <DealConflictDisclosureClient
            dealId={id}
            warningMessage={conflictSurface.warningMessage}
            acknowledgmentText={conflictSurface.acknowledgmentText}
            reasons={conflictSurface.reasons}
            viewerMustAcknowledge={conflictSurface.viewerMustAcknowledge}
            viewerHasAcknowledged={conflictSurface.viewerHasAcknowledged}
          />
        ) : null}

        <div className="mt-4">
          <BrokerMandatoryDisclosureStatus
            provided={mandatoryDisclosure.provided}
            enforcementEnabled={mandatoryBrokerDisclosureEnforced()}
          />
        </div>

        {(deal.leadContactOrigin === "IMMO_CONTACT" || deal.commissionSource === "IMMO_CONTACT") && (
          <div className="mt-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <span className="font-bold uppercase tracking-wide text-amber-400">ImmoContact</span>
            <span className="text-amber-100/80"> — platform-originated contact</span>
            {deal.commissionEligible ? (
              <span className="ml-2 text-xs text-amber-200/90">· Commission-eligible</span>
            ) : null}
            {deal.possibleBypassFlag ? (
              <span className="ml-2 text-xs font-semibold text-amber-300">· Flag: possible bypass (review)</span>
            ) : null}
            {deal.lead?.firstPlatformContactAt && (
              <span className="mt-1 block text-xs text-amber-200/70">
                First platform contact: {new Date(deal.lead.firstPlatformContactAt).toLocaleString()}
              </span>
            )}
          </div>
        )}

        <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-medium text-slate-200">Parties</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-400">
            <li>Buyer: {deal.buyer.name ?? deal.buyer.email}</li>
            <li>Seller: {deal.seller.name ?? deal.seller.email}</li>
            {deal.broker && <li>Broker: {deal.broker.name ?? deal.broker.email}</li>}
          </ul>
        </section>

        <section className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-medium text-slate-200">Milestones</h2>
          {deal.milestones.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No milestones yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {deal.milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{m.name}</span>
                  <span className={m.status === "completed" ? "text-emerald-400" : "text-slate-500"}>
                    {m.status === "completed" ? "Done" : "Pending"}
                    {m.completedAt && ` · ${new Date(m.completedAt).toLocaleDateString()}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-medium text-slate-200">Documents</h2>
          {deal.documents.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No documents yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {deal.documents.map((doc) => (
                <li key={doc.id} className="text-sm">
                  {doc.fileUrl ? (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                      {doc.type} · {doc.status}
                    </a>
                  ) : (
                    <span className="text-slate-300">
                      {doc.type} · {doc.status}
                      {doc.workflowStatus ? ` · ${doc.workflowStatus}` : ""}
                      <span className="ml-2 text-xs text-slate-500">(no file — draft / structured)</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-medium text-slate-200">Payments</h2>
          {deal.payments.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No payments yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {deal.payments.map((p) => (
                <li key={p.id} className="flex justify-between text-sm text-slate-400">
                  <span>{p.paymentType} · {(p.amountCents / 100).toFixed(2)} {p.currency}</span>
                  <span className={p.status === "paid" ? "text-emerald-400" : "text-slate-500"}>{p.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {legalTimeline ? (
          <DealLegalTimelineClient dealId={deal.id} timeline={legalTimeline} canEdit={canEditLegalTimeline} />
        ) : null}

        {deal.status !== "closed" && deal.status !== "cancelled" && isStripeConfigured() && (
          <DealDetailClient
            dealId={deal.id}
            priceCents={deal.priceCents}
          />
        )}
      </div>
    </main>
  );
}
