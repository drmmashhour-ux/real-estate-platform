import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canAccessPipelineDeal, canRecordCommitteeDecision } from "@/modules/deals/deal-policy";
import { getDealById } from "@/modules/deals/deal.service";
import { listFinancingConditions } from "@/modules/capital/financing-conditions.service";
import { getCapitalStack } from "@/modules/capital/capital-stack.service";
import { listOffersForDeal } from "@/modules/capital/lender-offer.service";
import { listLenders } from "@/modules/capital/lender.service";
import { getStoredClosingReadiness } from "@/modules/capital/closing-readiness.service";
import { CapitalPageClient } from "./capital-page-client";

export const dynamic = "force-dynamic";

export default async function DealCapitalPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; dealId: string }>;
}) {
  const { locale, country, dealId } = await params;
  const basePath = `/${locale}/${country}/dashboard/deals/${dealId}`;

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
  if (!allowed) redirect(`/${locale}/${country}/dashboard/deals`);

  const [stack, lenders, offers, fConds, readiness] = await Promise.all([
    getCapitalStack(dealId),
    listLenders(dealId),
    listOffersForDeal(dealId),
    listFinancingConditions(dealId),
    getStoredClosingReadiness(dealId),
  ]);

  const offerRows = offers.map((o) => ({
    id: o.id,
    lenderName: o.lender.lenderName,
    offeredAmount: o.offeredAmount,
    interestRate: o.interestRate,
    status: o.status,
  }));

  return (
    <div className="space-y-4 p-4 text-sm">
      <h1 className="text-lg font-semibold">Capital & financing</h1>
      <p className="text-muted-foreground font-mono text-xs">{deal.dealNumber}</p>

      <CapitalPageClient
        dealId={dealId}
        initialStack={stack}
        initialLenders={lenders.map((l) => ({ id: l.id, lenderName: l.lenderName, status: l.status }))}
        initialOffers={offerRows}
        initialFConds={fConds.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          isCritical: c.isCritical,
        }))}
        initialReadiness={
          readiness ?
            {
              readinessStatus: readiness.readinessStatus,
              lastEvaluatedAt: readiness.lastEvaluatedAt,
            }
          : null
        }
        offerComparedAt={deal.lastOfferComparedAt}
        basePath={basePath}
      />
    </div>
  );
}
