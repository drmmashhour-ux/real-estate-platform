import { InsuranceLeadStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  insuranceHubScopedWhere,
  requireInsuranceHubAccess,
} from "@/lib/insurance/require-insurance-hub";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireInsuranceHubAccess();
  if (!auth.ok) return auth.response;

  const where = insuranceHubScopedWhere(auth.userId, auth.role);

  const [leads, newCount, sentCount, convertedCount, totalForRate] = await Promise.all([
    prisma.insuranceLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        leadType: true,
        listingId: true,
        bookingId: true,
        source: true,
        status: true,
        estimatedValue: true,
        createdAt: true,
        assignedBrokerUserId: true,
      },
    }),
    prisma.insuranceLead.count({ where: { ...where, status: InsuranceLeadStatus.NEW } }),
    prisma.insuranceLead.count({ where: { ...where, status: InsuranceLeadStatus.SENT } }),
    prisma.insuranceLead.count({ where: { ...where, status: InsuranceLeadStatus.CONVERTED } }),
    prisma.insuranceLead.count({
      where: {
        ...where,
        status: { notIn: [InsuranceLeadStatus.REJECTED] },
      },
    }),
  ]);

  const closedDenominator = Math.max(1, totalForRate);
  const conversionRatePct = Math.round((convertedCount / closedDenominator) * 1000) / 10;

  return Response.json({
    ok: true,
    leads,
    kpis: {
      newLeads: newCount,
      quotesSent: sentCount,
      policiesClosed: convertedCount,
      conversionRatePct,
      conversionNote: "Closed ÷ active pipeline (excludes declined). Informational only.",
    },
  });
}
