import { apiFetch } from "./api";

export type MobileAdminMovement = {
  id: string;
  timeLabel: string;
  typeLabel: string;
  hubLabel: string;
  detail: string;
};

export type MobileAdminDashboardResponse = {
  summary: {
    revenueTodayCents: number;
    bookingsToday: number;
    leadsToday: number;
    newUsersToday: number;
    riskAlertsApprox: number;
  };
  revenue: {
    todayRevenueCents: number;
    sevenDayAverageCents: number;
    highestHubLabel: string;
    transactions: number;
  };
  movements: MobileAdminMovement[];
  insights: string[];
  stats: {
    revenueTodayDisplay: string;
    bookingsToday: number;
    leadsToday: number;
    alertsApprox: number;
    newUsersToday: number;
    transactionsToday: number;
    topHubLabel: string;
  };
};

export type MobileInvestorDashboardResponse = {
  stats: {
    portfolioValueDisplay: string;
    monthlyRevenueDisplay: string;
    roiDisplay: string;
    revenueAtRiskDisplay: string;
    protectedValueDisplay: string;
  };
  portfolio: Array<{
    id: string;
    name: string;
    location: string;
    revenueDisplay: string;
    occupancyDisplay: string;
    roiDisplay: string;
    risk: "Low" | "Medium" | "High";
  }>;
  opportunities: Array<{
    id: string;
    area: string;
    label: string;
    upsideDisplay: string;
  }>;
  alerts: string[];
  hasPortfolioData: boolean;
};

export async function fetchInvestorDashboard(token: string) {
  return apiFetch<MobileInvestorDashboardResponse>("/api/mobile/dashboard/investor", token);
}

export async function fetchBuyerDashboard(token: string) {
  return apiFetch<unknown>("/api/mobile/dashboard/buyer", token);
}

export async function fetchSellerDashboard(token: string) {
  return apiFetch<unknown>("/api/mobile/dashboard/seller", token);
}

export async function fetchBrokerDashboard(token: string) {
  return apiFetch<unknown>("/api/mobile/dashboard/broker", token);
}

export async function fetchAdminDashboard(token: string) {
  return apiFetch<MobileAdminDashboardResponse>("/api/mobile/dashboard/admin", token);
}
