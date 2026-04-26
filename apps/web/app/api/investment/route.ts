import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * Saved portfolio analyses (`InvestmentDeal`) + ranked listing opportunities (`InvestmentOpportunity`).
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deals = await prisma.investmentDeal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        city: true,
        roi: true,
        rating: true,
        riskScore: true,
        propertyPrice: true,
        monthlyRent: true,
        preferredStrategy: true,
        createdAt: true,
      },
    });

    let opportunities: Awaited<ReturnType<typeof prisma.investmentOpportunity.findMany>> = [];
    if (user.role === PlatformRole.ADMIN || user.role === PlatformRole.BROKER) {
      opportunities = await prisma.investmentOpportunity.findMany({
        orderBy: { score: "desc" },
        take: 30,
        select: {
          id: true,
          score: true,
          expectedROI: true,
          riskLevel: true,
          recommendedInvestmentMajor: true,
          createdAt: true,
          listingId: true,
          listing: { select: { title: true, listingCode: true } },
        },
      });
    }

    return NextResponse.json({ deals, opportunities });
  } catch (e) {
    console.error("[api/investment]", e);
    return NextResponse.json({ error: "Failed to load investment data" }, { status: 500 });
  }
}
