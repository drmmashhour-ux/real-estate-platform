import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { isTopBrokerDisplay } from "@/modules/mortgage/services/broker-public-display";

export const dynamic = "force-dynamic";

/** Latest mortgage request + assigned broker for the signed-in user. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ broker: null, request: null, pendingBrokerReview: false });
  }

  const latest = await prisma.mortgageRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      broker: true,
    },
  });

  if (!latest) {
    return NextResponse.json({ broker: null, request: null, pendingBrokerReview: false });
  }

  const review = await prisma.brokerReview.findUnique({
    where: { mortgageRequestId: latest.id },
    select: { id: true },
  });

  const st = latest.status.toLowerCase();
  const pendingBrokerReview =
    !review && (st === "contacted" || st === "approved") && !!latest.brokerId;

  return NextResponse.json({
    request: {
      id: latest.id,
      status: latest.status,
      propertyPrice: latest.propertyPrice,
      downPayment: latest.downPayment,
      income: latest.income,
      intentLevel: latest.intentLevel,
      timeline: latest.timeline,
      preApproved: latest.preApproved,
      createdAt: latest.createdAt.toISOString(),
      estimatedApprovalAmount: latest.estimatedApprovalAmount,
      estimatedMonthlyPayment: latest.estimatedMonthlyPayment,
      approvalConfidence: latest.approvalConfidence,
    },
    broker: latest.broker
      ? {
          id: latest.broker.id,
          name: latest.broker.name,
          email: latest.broker.email,
          phone: latest.broker.phone,
          company: latest.broker.company,
          rating: latest.broker.rating,
          totalReviews: latest.broker.totalReviews,
          responseTimeAvg: latest.broker.responseTimeAvg,
          totalLeadsHandled: latest.broker.totalLeadsHandled,
          isTopBroker: isTopBrokerDisplay(latest.broker.rating, latest.broker.totalReviews),
        }
      : null,
    pendingBrokerReview,
  });
}
