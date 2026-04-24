export class CeoGrowthEngine {
  static analyze(data: any) {
    const { crmStats, investorActivity, esgStats } = data;

    const insights: any[] = [];

    // 1. Demand/Supply Imbalance
    if (crmStats.leadInflow > 100 && data.dealPipeline.volume < 20) {
      insights.push({
        category: "MARKET",
        title: "Supply/Demand Imbalance: High Demand",
        description: "Lead volume is significantly higher than deal volume. Market is hungry for more inventory.",
        impactScore: 80,
        confidenceScore: 85,
        supportingDataJson: { leads: crmStats.leadInflow, deals: data.dealPipeline.volume }
      });
    }

    // 2. Capital Flow
    if (investorActivity.newCapital > 1000000) {
      insights.push({
        category: "CAPITAL",
        title: "Strong Capital Inflow",
        description: `Over $${(investorActivity.newCapital / 1000000).toFixed(1)}M in new capital deployed this month. High growth potential.`,
        impactScore: 90,
        confidenceScore: 98,
        supportingDataJson: { newCapital: investorActivity.newCapital }
      });
    }

    // 3. ESG Growth
    if (esgStats.retrofitActivity > 5) {
      insights.push({
        category: "GROWTH",
        title: "ESG Retrofit Momentum",
        description: "Increasing number of properties undergoing ESG retrofits. This segment is scaling rapidly.",
        impactScore: 75,
        confidenceScore: 80,
        supportingDataJson: { retrofits: esgStats.retrofitActivity }
      });
    }

    return {
      insights,
      growthIndex: (crmStats.leadInflow / 500 + investorActivity.newCapital / 5000000) * 100
    };
  }
}
