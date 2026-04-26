/**
 * GET /api/billing/broker-invoices — Commission invoices (issuer = BROKER) for the signed-in broker.
 */

import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const invoices = await prisma.platformInvoice.findMany({
    where: { userId, invoiceIssuer: "BROKER" },
    include: {
      payment: {
        select: {
          id: true,
          paymentType: true,
          amountCents: true,
          currency: true,
          status: true,
          dealId: true,
          listingId: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ invoices });
}
