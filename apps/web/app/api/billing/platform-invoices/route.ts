/**
 * GET /api/billing/platform-invoices – List platform invoices for the signed-in payer only.
 * Includes platform GST/QST / legal name as stored on the invoice (for customer copy) — not a public endpoint.
 */

import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const invoices = await prisma.platformInvoice.findMany({
    where: { userId, invoiceIssuer: "PLATFORM" },
    include: {
      payment: {
        select: {
          id: true,
          paymentType: true,
          amountCents: true,
          currency: true,
          status: true,
          bookingId: true,
          dealId: true,
          createdAt: true,
          brokerTaxSnapshot: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ invoices });
}
