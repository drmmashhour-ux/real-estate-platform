import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { DealDetailClient } from "./deal-detail-client";
import { DealLegalTimelineClient } from "./deal-legal-timeline-client";
import { getDealLegalTimeline } from "@/lib/deals/legal-timeline";

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
};

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) notFound();
  const { id } = await params;

  const deal = await prisma.deal.findFirst({
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
  const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const legalTimeline = await getDealLegalTimeline(deal.id);
  const canEditLegalTimeline = viewer?.role === "ADMIN" || viewer?.role === "BROKER" || deal.brokerId === userId;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/dashboard/deals" className="text-sm text-amber-400 hover:text-amber-300">
          ← Deals
        </Link>
        <p className="mt-3">
          <Link
            href={`/dashboard/deals/${id}/coordination`}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Coordination hub →
          </Link>
        </p>
        <h1 className="mt-4 text-2xl font-semibold">Deal</h1>
        <p className="mt-1 text-slate-400">
          Status: {STATUS_LABELS[deal.status] ?? deal.status} · ${(deal.priceCents / 100).toLocaleString()}
        </p>

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
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                    {doc.type} · {doc.status}
                  </a>
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
