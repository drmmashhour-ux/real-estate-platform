import { prisma } from "@/lib/db";
import { getCityConfig } from "./geo-target.config";

export interface CityMarketMetrics {
  cityName: string;
  totalBrokers: number;
  activeBrokers: number;
  totalDeals: number;
  totalRevenue: number;
  readinessScore: number;
  isReadyForExpansion: boolean;
}

export async function getMarketMetricsForCity(city: string): Promise<CityMarketMetrics> {
  const [brokersCount, activeBrokersCount, dealsCount, revenueData] = await Promise.all([
    // Total brokers in city (using OutreachLead for sourcing + User roles)
    prisma.outreachLead.count({ where: { city, status: "ONBOARDED" } }),
    
    // Active brokers (those who have logged in or interacted in last 30 days)
    prisma.user.count({ 
      where: { 
        homeCity: city, 
        role: "BROKER",
        lastActivityAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      } 
    }),

    // Deals in city
    prisma.lead.count({ where: { purchaseRegion: city, leadStatus: "PURCHASED" } }),

    // Revenue per city (from purchased leads)
    prisma.lead.aggregate({
      where: { purchaseRegion: city, leadStatus: "PURCHASED" },
      _sum: { dynamicLeadPriceCents: true }
    })
  ]);

  const totalRevenue = (revenueData._sum.dynamicLeadPriceCents || 0) / 100;
  
  // Readiness Logic: ≥50 active brokers, strong retention, stable revenue
  const isReadyForExpansion = activeBrokersCount >= 50 && totalRevenue >= 5000;
  
  // Readiness score 0-100
  const readinessScore = Math.min(100, (activeBrokersCount / 50) * 50 + (totalRevenue / 5000) * 50);

  return {
    cityName: city,
    totalBrokers: brokersCount,
    activeBrokers: activeBrokersCount,
    totalDeals: dealsCount,
    totalRevenue,
    readinessScore,
    isReadyForExpansion
  };
}

export async function checkMarketReadiness(city: string) {
  const metrics = await getMarketMetricsForCity(city);
  return {
    isReady: metrics.isReadyForExpansion,
    metrics
  };
}
