import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import {
  compareDealToMarket,
  computeDealMetrics,
  computeInvestmentInsights,
  resolveMarketCityInput,
} from "@/lib/investment/deal-metrics";
import { compareRentalStrategies } from "@/lib/investment/rental-strategy-compare";
import { RENTAL_TYPE, type RentalType } from "@/lib/investment/rental-model";
import {
  canSaveMoreDeals,
  INVESTMENT_LIMIT_MESSAGE,
} from "@/lib/investment/monetization";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deals = await prisma.investmentDeal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deals);
}

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const propertyPrice = Number(b.propertyPrice);
  const monthlyRent = Number(b.monthlyRent);
  const monthlyExpenses = Number(b.monthlyExpenses);
  const nightlyRate = Number(b.nightlyRate);
  const occupancyRate = Number(b.occupancyRate);
  const cityRaw = typeof b.city === "string" ? b.city.trim() : "";

  if (
    !Number.isFinite(propertyPrice) ||
    !Number.isFinite(monthlyRent) ||
    !Number.isFinite(monthlyExpenses) ||
    !Number.isFinite(nightlyRate) ||
    !Number.isFinite(occupancyRate)
  ) {
    return NextResponse.json(
      { error: "propertyPrice, monthlyRent, monthlyExpenses, nightlyRate, and occupancyRate must be numbers" },
      { status: 400 }
    );
  }
  if (propertyPrice <= 0) {
    return NextResponse.json({ error: "propertyPrice must be greater than 0" }, { status: 400 });
  }
  if (monthlyRent < 0) {
    return NextResponse.json({ error: "monthlyRent must be 0 or greater" }, { status: 400 });
  }
  if (monthlyExpenses < 0) {
    return NextResponse.json({ error: "monthlyExpenses must be 0 or greater" }, { status: 400 });
  }
  if (nightlyRate < 0) {
    return NextResponse.json({ error: "nightlyRate must be 0 or greater" }, { status: 400 });
  }
  if (occupancyRate < 0 || occupancyRate > 100) {
    return NextResponse.json({ error: "occupancyRate must be between 0 and 100" }, { status: 400 });
  }
  const city =
    cityRaw === "" ? "Montréal" : resolveMarketCityInput(cityRaw);
  if (!city) {
    return NextResponse.json(
      { error: "city must be a Québec locality from the platform list (see analyze deal form)." },
      { status: 400 }
    );
  }

  const [user, existingCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.investmentDeal.count({ where: { userId } }),
  ]);

  if (!canSaveMoreDeals(user?.plan ?? "free", existingCount)) {
    return NextResponse.json(
      {
        error: INVESTMENT_LIMIT_MESSAGE,
        code: "INVESTMENT_DEAL_LIMIT",
        upgrade: true,
      },
      { status: 403 }
    );
  }

  const dual = compareRentalStrategies(propertyPrice, monthlyRent, monthlyExpenses, nightlyRate, occupancyRate);
  const preferredStrategy: RentalType = dual.preferredStrategy;
  const preferredMonthlyIncome =
    preferredStrategy === RENTAL_TYPE.SHORT_TERM ? dual.monthlyRevenueShortTerm : dual.monthlyRentLongTerm;

  const roi = preferredStrategy === RENTAL_TYPE.SHORT_TERM ? dual.roiShortTerm : dual.roiLongTerm;
  const { monthlyCashFlow } = computeDealMetrics(propertyPrice, preferredMonthlyIncome, monthlyExpenses);
  const { riskScore, rating } = computeInvestmentInsights(roi, monthlyCashFlow);
  const { marketComparison } = compareDealToMarket(roi, city);

  const deal = await prisma.investmentDeal.create({
    data: {
      userId,
      rentalType: preferredStrategy,
      preferredStrategy,
      propertyPrice,
      monthlyRent,
      monthlyExpenses,
      nightlyRate,
      occupancyRate,
      roiLongTerm: dual.roiLongTerm,
      roiShortTerm: dual.roiShortTerm,
      roi,
      riskScore,
      rating,
      city,
      marketComparison,
    },
  });

  return NextResponse.json(deal, { status: 201 });
}
