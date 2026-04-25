import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { POST as createDealViaCoreApi } from "@/app/api/deals/route";

export const dynamic = "force-dynamic";

/** Delegates to the hardened `POST /api/deals` broker flow (listing + buyer email + no client-supplied party IDs). */
export async function POST(request: NextRequest) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  return createDealViaCoreApi(request);
}

export async function GET() {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;

  const deals = await prisma.deal.findMany({
    where: { brokerId: session.userId, status: { notIn: ["closed", "cancelled"] } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      _count: { select: { documents: true } },
    },
  });

  return Response.json({ deals });
}
