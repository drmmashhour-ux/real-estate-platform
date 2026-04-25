import { NextResponse } from "next/server";

export async function GET() {
  // Mocking defensibility metrics
  // In a real scenario, these would be aggregated from Prisma (TurboDraft, Deal, User, etc.)
  
  const dataGrowth = {
    totalListings: 12450,
    listingGrowthPercent: 12.5,
    uniqueDataPoints: 450000,
    proprietaryClauses: 850,
    dataRetentionRate: 99.4,
  };

  const networkStrength = {
    activeBrokers: 1240,
    networkDensity: 0.65, // Connection ratio
    referralConversionRate: 24.8,
    marketPenetration: 18.2, // % of QC market
    churnRate: 1.2,
  };

  const aiImprovement = {
    modelAccuracy: 96.8,
    draftingSpeedImprovement: 450, // % faster than manual
    riskDetectionHitRate: 98.2,
    learningLoopsCompleted: 124,
    autonomousResolutionRate: 34.5,
  };

  const successMetrics = {
    retention: 94.5,
    dataAdvantageScore: 88,
    competitiveMoatDepth: "HIGH",
  };

  return NextResponse.json({
    dataGrowth,
    networkStrength,
    aiImprovement,
    successMetrics,
    updatedAt: new Date().toISOString(),
  });
}
