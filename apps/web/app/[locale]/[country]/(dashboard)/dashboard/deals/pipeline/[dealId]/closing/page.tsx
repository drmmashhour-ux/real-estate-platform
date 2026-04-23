import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { evaluateClosing } from "@/modules/closing/closing-validation.service";
import { getClosingByDealId } from "@/modules/closing/closing.service";
import { canAccessPipelineDeal, canRecordCommitteeDecision } from "@/modules/deals/deal-policy";
import { getDealById } from "@/modules/deals/deal.service";
import { ClosingRoomClient } from "./closing-room-client";

export const dynamic = "force-dynamic";

export default async function ClosingRoomPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; dealId: string }>;
}) {
  const { locale, country, dealId } = await params;
  const baseBack = `/${locale}/${country}/dashboard/deals/${dealId}`;

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

  const closing = await getClosingByDealId(dealId);
  let validation: { status: string; issues: string[] } | null = null;
  if (closing) {
    validation = await evaluateClosing(dealId);
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold">Closing room</h1>
      <p className="font-mono text-xs text-muted-foreground">{deal.dealNumber}</p>

      <ClosingRoomClient
        dealId={dealId}
        initialClosing={
          closing ?
            {
              closingStatus: closing.closingStatus,
              closingDate: closing.closingDate,
              notaryName: closing.notaryName,
              notaryEmail: closing.notaryEmail,
              checklistItems: closing.checklistItems.map((i) => ({
                id: i.id,
                label: i.label,
                status: i.status,
                isCritical: i.isCritical,
              })),
              closingDocuments: closing.closingDocuments.map((d) => ({
                id: d.id,
                title: d.title,
                docType: d.docType,
                status: d.status,
              })),
            }
          : null
        }
        initialValidation={validation}
        baseBack={baseBack}
      />
    </div>
  );
}
