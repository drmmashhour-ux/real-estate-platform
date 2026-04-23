import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { buildMonetizationSnapshot } from "@/lib/investment/monetization";
import { prisma } from "@repo/db";
import { MvpNav } from "@/components/investment/MvpNav";
import { DealCompareClient, type SerializableDeal } from "./deal-compare-client";
import type { RentalType } from "@/lib/investment/rental-model";

export const metadata: Metadata = {
  title: "Compare deals",
  description: "Compare 2–4 saved investment analyses side by side.",
};

export const dynamic = "force-dynamic";

export default async function CompareDealsPage() {
  const { userId } = await requireAuthenticatedUser();

  const [rows, user] = await Promise.all([
    prisma.investmentDeal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
  ]);

  const monetization = buildMonetizationSnapshot(user?.plan ?? "free", rows.length);

  const serialized: SerializableDeal[] = rows.map((d) => ({
    id: d.id,
    rentalType: d.rentalType as RentalType,
    preferredStrategy: d.preferredStrategy as RentalType,
    propertyPrice: d.propertyPrice,
    monthlyRent: d.monthlyRent,
    monthlyExpenses: d.monthlyExpenses,
    nightlyRate: d.nightlyRate ?? undefined,
    occupancyRate: d.occupancyRate ?? undefined,
    roiLongTerm: d.roiLongTerm ?? undefined,
    roiShortTerm: d.roiShortTerm ?? undefined,
    roi: d.roi,
    riskScore: d.riskScore,
    rating: d.rating,
    city: d.city,
    marketComparison: d.marketComparison,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <MvpNav variant="live" />
      <DealCompareClient deals={serialized} variant="live" monetization={monetization} />
    </div>
  );
}
