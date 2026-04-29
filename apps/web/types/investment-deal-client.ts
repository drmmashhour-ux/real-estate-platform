/** Investment portfolio dashboard — mirrors fields used by `PortfolioDashboardClient`. */

export type InvestmentDealRowView = {
  id: string;
  rentalType: string;
  preferredStrategy: string;
  propertyPrice: number;
  monthlyRent: number;
  monthlyExpenses: number;
  nightlyRate: number | null;
  occupancyRate: number | null;
  roiLongTerm: number | null;
  roiShortTerm: number | null;
  roi: number;
  riskScore: number;
  rating: string;
  city: string;
  marketComparison: string;
};

export type PortfolioDashboardDealRow = InvestmentDealRowView & {
  createdAt: Date | string;
};
