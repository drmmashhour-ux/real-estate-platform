import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/** Shape expected by `computePortfolioHealth` / `generatePortfolioRecommendations`. */
export type AutopilotPropertyInput = {
  id: string;
  address: string;
  neighborhoodKey?: string | null;
  currentValueCents?: number | null;
  monthlyCashflowCents?: number | null;
  capRate?: number | null;
  /** Decimal fraction, e.g. 0.085 for 8.5% — matches health engine. */
  roiPercent?: number | null;
  dscr?: number | null;
  rankingScore?: number | null;
  riskLevel?: string | null;
  neighborhoodScore?: number | null;
};

function riskLevelFromDeal(rating: string | undefined | null): string | null {
  if (!rating) return null;
  const r = rating.toLowerCase();
  if (r.includes("high risk")) return "high";
  if (r.includes("moderate")) return "medium";
  if (r.includes("strong")) return "low";
  return "medium";
}

function neighborhoodScoreFromCity(city: string): number {
  let h = 0;
  for (let i = 0; i < city.length; i++) h = (h + city.charCodeAt(i) * (i + 1)) % 37;
  return 55 + (h % 21);
}

/**
 * `InvestorPortfolio` rows are per holding (project + optional unit); there is no `properties` relation.
 * We aggregate all holdings for the same `userId` and enrich from `Project` + best-effort `InvestmentDeal`.
 */
export async function loadAutopilotPropertiesForInvestorUser(userId: string): Promise<{
  properties: AutopilotPropertyInput[];
  thinData: boolean;
  holdingCount: number;
  dealCount: number;
}> {
  const [holdings, deals] = await Promise.all([
    prisma.investorPortfolio.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.investmentDeal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  const projectIds = [...new Set(holdings.map((h) => h.projectId))];
  const projects =
    projectIds.length > 0
      ? await prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true, name: true, city: true, address: true },
        })
      : [];
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const dealsByCity = new Map<string, (typeof deals)[0]>();
  for (const d of deals) {
    const key = d.city.trim().toLowerCase();
    if (!dealsByCity.has(key)) dealsByCity.set(key, d);
  }

  const properties: AutopilotPropertyInput[] = holdings.map((h) => {
    const project = projectById.get(h.projectId);
    const city = project?.city ?? "Unknown";
    const address = project ? `${project.name} — ${project.address}, ${city}` : `Project ${h.projectId}`;
    const deal = dealsByCity.get(city.trim().toLowerCase()) ?? deals[0];
    const valueDollars = h.currentValue ?? h.purchasePrice;
    const currentValueCents = Math.round(Math.max(0, valueDollars) * 100);

    let monthlyCashflowCents: number | null = null;
    let capRate: number | null = null;
    let roiPercent: number | null = null;
    let dscr: number | null = null;
    let rankingScore: number | null = null;
    let riskLevel: string | null = null;

    if (deal) {
      const monthlyNet = (deal.monthlyRent ?? 0) - (deal.monthlyExpenses ?? 0);
      monthlyCashflowCents = Math.round(monthlyNet * 100);
      const price = deal.propertyPrice > 0 ? deal.propertyPrice : valueDollars;
      if (price > 0) {
        capRate = ((deal.monthlyRent ?? 0) * 12) / price;
      }
      roiPercent = (deal.roi ?? 0) / 100;
      dscr = deal.riskScore != null ? Math.max(0.5, 2.2 - deal.riskScore / 80) : null;
      rankingScore = Math.max(
        0,
        Math.min(100, 100 - (deal.riskScore ?? 50) * 0.8 + (deal.roi ?? 0) * 0.25)
      );
      riskLevel = riskLevelFromDeal(deal.rating);
    }

    const neighborhoodScore = neighborhoodScoreFromCity(city);

    return {
      id: h.id,
      address,
      neighborhoodKey: city,
      currentValueCents,
      monthlyCashflowCents,
      capRate,
      roiPercent,
      dscr,
      rankingScore,
      riskLevel,
      neighborhoodScore,
    };
  });

  const thinData = holdings.length === 0 || deals.length === 0;

  return {
    properties,
    thinData,
    holdingCount: holdings.length,
    dealCount: deals.length,
  };
}

/**
 * Resolve the investor user id from any `InvestorPortfolio` row id, or return the id if it already looks like a user uuid.
 */
export async function resolveInvestorUserIdFromPortfolioKey(portfolioId: string): Promise<string | null> {
  const holding = await prisma.investorPortfolio.findUnique({
    where: { id: portfolioId },
    select: { userId: true },
  });
  return holding?.userId ?? null;
}
