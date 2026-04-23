/** Client-safe portfolio compute shape (mirrors `PortfolioProperty` rows). */
export type ComputedPortfolioProperty = {
  id: string;
  portfolioId: string;
  address: string;
  city: string | null;
  capRate: number | null;
  roiPercent: number | null;
  monthlyCashflowCents: number | null;
  dscr: number | null;
  neighborhoodScore: number | null;
  riskLevel: string | null;
  currentValueCents: number | null;
  rankingScore: number | null;
  rankingLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ComputedPortfolio = {
  id: string;
  title: string;
  totalValueCents: number;
  totalCashflowCents: number;
  avgCapRate: number;
  avgROI: number;
  properties: ComputedPortfolioProperty[];
};
