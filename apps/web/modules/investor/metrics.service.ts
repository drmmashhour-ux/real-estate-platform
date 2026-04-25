import { prisma } from "@/lib/db";
import { fetchRevenueMetrics } from "../revenue/infrastructure/revenueService";

export interface InvestorMetrics {
  totalBrokers: number;
  activeBrokers: number;
  totalRevenueCad: number;
  revenueGrowthMonthOverMonth: number;
  leadConversionRate: number;
  brokerRetentionRate: number;
  generatedAt: string;
}

export interface InvestorSnapshot {
  metrics: InvestorMetrics;
  generatedAt: string;
  status: "BULLISH" | "STABLE" | "NEUTRAL";
  note: string;
}

export async function getInvestorMetrics(): Promise<InvestorMetrics> {
  // Use $queryRaw for counts to be resilient to large schema client issues
  // Note: table names must match information_schema.tables exactly
  const totalBrokersRes = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM broker_profile` as any[];
  const activeBrokersRes = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM broker_profile WHERE onboarding_completed_at IS NOT NULL` as any[];
  
  const totalBrokers = Number(totalBrokersRes[0]?.count || 0);
  const activeBrokers = Number(activeBrokersRes[0]?.count || 0);
  
  let revenueMetrics;
  try {
    revenueMetrics = await fetchRevenueMetrics();
  } catch (e) {
    revenueMetrics = { mrr: { mrr: 0 }, churn: { churnRate: 0 }, ltv: { ltv: 0 } };
  }

  // Calculate total revenue from PaymentRecord (example table)
  const payments = await (prisma as any).paymentRecord.aggregate({
    _sum: { amount: true },
  });
  const totalRevenueCad = payments._sum.amount || 0;

  // Revenue growth MoM (simplified logic)
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [currentMonthRev, lastMonthRev] = await Promise.all([
    (prisma as any).paymentRecord.aggregate({
      where: { createdAt: { gte: startOfCurrentMonth } },
      _sum: { amount: true },
    }),
    (prisma as any).paymentRecord.aggregate({
      where: {
        createdAt: { gte: startOfLastMonth, lt: startOfCurrentMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  const curRev = currentMonthRev._sum.amount || 0;
  const lastRev = lastMonthRev._sum.amount || 0;
  const revenueGrowthMonthOverMonth = lastRev > 0 ? (curRev - lastRev) / lastRev : 0;

  // Lead conversion rate: leads that were purchased vs total leads
  // Note: Model Lead might be Lead or leads. Based on information_schema it is "Lead".
  const totalLeadsRes = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Lead"` as any[];
  const purchasedLeadsRes = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Lead" WHERE status = 'PURCHASED'` as any[];
  
  const totalLeads = totalLeadsRes[0]?.count || 0;
  const purchasedLeads = purchasedLeadsRes[0]?.count || 0;
  const leadConversionRate = totalLeads > 0 ? purchasedLeads / totalLeads : 0;

  // Broker retention rate: brokers who purchased more than once in the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const repeatPurchasers = await prisma.$queryRaw`
    SELECT COUNT(*) as count 
    FROM (
      SELECT contact_unlocked_by_user_id 
      FROM "Lead" 
      WHERE status = 'PURCHASED' AND updated_at >= ${ninetyDaysAgo}
      GROUP BY contact_unlocked_by_user_id
      HAVING COUNT(*) > 1
    ) as sub
  ` as any[];
  
  const totalPurchasers = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT contact_unlocked_by_user_id) as count 
    FROM "Lead" 
    WHERE status = 'PURCHASED' AND updated_at >= ${ninetyDaysAgo}
  ` as any[];

  const repeatCount = Number(repeatPurchasers[0]?.count || 0);
  const totalCount = Number(totalPurchasers[0]?.count || 0);
  const brokerRetentionRate = totalCount > 0 ? repeatCount / totalCount : 0;

  return {
    totalBrokers,
    activeBrokers,
    totalRevenueCad,
    revenueGrowthMonthOverMonth,
    leadConversionRate,
    brokerRetentionRate,
    generatedAt: new Date().toISOString(),
  };
}

export async function getInvestorSnapshot(): Promise<InvestorSnapshot> {
  const metrics = await getInvestorMetrics();
  const isGrowing = metrics.revenueGrowthMonthOverMonth > 0.05;
  const hasBrokers = metrics.activeBrokers > 0;

  return {
    metrics,
    generatedAt: new Date().toISOString(),
    status: isGrowing ? "BULLISH" : (hasBrokers ? "STABLE" : "NEUTRAL"),
    note: isGrowing ? "Strong growth signals in primary markets." : "Building foundational broker base.",
  };
}
