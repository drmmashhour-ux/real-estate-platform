import { notFound } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getListingById } from "@/lib/bnhub/listings";
import { canViewOffer, resolveOfferActorRole } from "@/modules/offers/services/offer-access";
import { filterEventsForViewer } from "@/modules/offers/services/serialize-offer";
import { maskEmail } from "@/modules/offers/services/mask-email";
import { OfferDetailClient } from "@/components/offers/OfferDetailClient";
import {
  DealFinancialPanel,
  type DealFinancialPanelData,
  type LinkedInvoiceSummary,
} from "@/components/finance/DealFinancialPanel";
import { buildIntakeReadinessSummary } from "@/modules/intake/services/build-intake-readiness-summary";
import { getVerifiedTenantIdForUser } from "@/modules/tenancy/services/tenant-page-guard";

export const dynamic = "force-dynamic";

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuthenticatedUser();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) notFound();

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      buyer: { select: { name: true, email: true } },
    },
  });
  if (!offer) notFound();
  if (!canViewOffer({ userId, role: user.role, offer })) notFound();

  const actor = resolveOfferActorRole({ userId, role: user.role, offer });
  if (!actor) notFound();

  const events = filterEventsForViewer(offer.events, actor === "buyer" ? "buyer" : "broker");
  const listingRow = await getListingById(offer.listingId);
  const listingTitle = listingRow?.title ?? null;

  const buyerView =
    offer.buyerId === userId
      ? { name: offer.buyer?.name ?? null, email: offer.buyer?.email ?? null }
      : { name: offer.buyer?.name ?? null, email: maskEmail(offer.buyer?.email ?? undefined) };

  const relatedAppointments = await prisma.appointment.findMany({
    where: { offerId: id },
    orderBy: { startsAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      status: true,
      type: true,
      startsAt: true,
      endsAt: true,
    },
  });

  const intakeForBuyer =
    offer.brokerId && offer.buyerId
      ? await prisma.brokerClient.findFirst({
          where: { brokerId: offer.brokerId, userId: offer.buyerId },
          include: {
            intakeProfile: true,
            requiredDocumentItems: {
              where: { deletedAt: null },
              select: { isMandatory: true, status: true, deletedAt: true },
            },
          },
        })
      : null;
  const buyerIntakeSummary = intakeForBuyer
    ? buildIntakeReadinessSummary(intakeForBuyer.intakeProfile, intakeForBuyer.requiredDocumentItems)
    : null;

  const verifiedTenant = await getVerifiedTenantIdForUser(userId, user.role);
  const showFinancePanel =
    (actor === "broker" || user.role === "ADMIN") &&
    (user.role === "ADMIN" || !offer.tenantId || verifiedTenant === offer.tenantId);

  let dealFinancialBlock: {
    dealFinancial: DealFinancialPanelData | null;
    invoices: LinkedInvoiceSummary[];
  } | null = null;

  if (showFinancePanel) {
    const df = await prisma.dealFinancial.findFirst({
      where: {
        offerId: id,
        ...(offer.tenantId ? { tenantId: offer.tenantId } : {}),
      },
      include: { commissionSplits: { orderBy: { createdAt: "asc" } } },
    });
    const invs = await prisma.tenantInvoice.findMany({
      where: {
        offerId: id,
        ...(offer.tenantId ? { tenantId: offer.tenantId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        currency: true,
      },
    });
    dealFinancialBlock = {
      dealFinancial: df
        ? {
            id: df.id,
            salePrice: df.salePrice,
            commissionRate: df.commissionRate,
            grossCommission: df.grossCommission,
            netCommission: df.netCommission,
            currency: df.currency,
            splits: df.commissionSplits.map((s) => ({
              id: s.id,
              roleLabel: s.roleLabel,
              percent: s.percent,
              amount: s.amount,
              status: s.status,
            })),
          }
        : null,
      invoices: invs.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        totalAmount: inv.totalAmount,
        currency: inv.currency,
      })),
    };
  }

  const initialOffer = {
    id: offer.id,
    listingId: offer.listingId,
    listingTitle,
    status: offer.status,
    offeredPrice: offer.offeredPrice,
    downPaymentAmount: offer.downPaymentAmount,
    financingNeeded: offer.financingNeeded,
    closingDate: offer.closingDate?.toISOString() ?? null,
    conditions: offer.conditions,
    message: offer.message,
    buyer: buyerView,
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
      metadata: e.metadata,
    })),
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-3xl space-y-6">
        {buyerIntakeSummary && intakeForBuyer ? (
          <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
            <p className="font-medium text-white">Client intake readiness</p>
            <p className="mt-1 text-slate-400">{buyerIntakeSummary.headline}</p>
            <p className="mt-1 text-xs text-slate-500">{buyerIntakeSummary.detail}</p>
            {actor === "broker" ? (
              <a
                href={`/dashboard/broker/intake/${intakeForBuyer.id}`}
                className="mt-2 inline-block text-xs text-emerald-400 hover:underline"
              >
                Open broker intake workspace →
              </a>
            ) : (
              <a href="/dashboard/intake" className="mt-2 inline-block text-xs text-emerald-400 hover:underline">
                Open your intake checklist →
              </a>
            )}
          </section>
        ) : null}
        {dealFinancialBlock ? (
          <DealFinancialPanel
            contextLabel="Deal financials (this offer)"
            financeHomeHref="/dashboard/finance"
            dealFinancial={dealFinancialBlock.dealFinancial}
            invoices={dealFinancialBlock.invoices}
          />
        ) : null}
        <OfferDetailClient initialOffer={initialOffer} viewer={actor} />
        {relatedAppointments.length > 0 ? (
          <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
            <h2 className="font-semibold text-white">Related appointments</h2>
            <ul className="mt-2 space-y-2">
              {relatedAppointments.map((a) => (
                <li key={a.id}>
                  <a href={`/dashboard/appointments/${a.id}`} className="text-emerald-400 hover:underline">
                    {a.title}
                  </a>
                  <span className="text-slate-500">
                    {" "}
                    · {a.type.replace(/_/g, " ")} · {a.status} · {a.startsAt.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
