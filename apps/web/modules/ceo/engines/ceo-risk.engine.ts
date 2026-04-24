export class CeoRiskEngine {
  static analyze(data: any) {
    const { dealPipeline, investorActivity, revenueStats } = data;

    const insights: any[] = [];

    // 1. Concentration Risk
    if (dealPipeline.volume > 0 && dealPipeline.totalValue / dealPipeline.volume > 1000000) {
      insights.push({
        category: "RISK",
        title: "High Deal Concentration Risk",
        description: "Large portion of value tied to a small number of high-value deals. Single-deal failure could impact quarterly targets.",
        impactScore: 70,
        confidenceScore: 85,
        supportingDataJson: { avgValue: dealPipeline.totalValue / dealPipeline.volume }
      });
    }

    // 2. Capital Exposure
    if (investorActivity.newCapital === 0 && dealPipeline.volume > 10) {
      insights.push({
        category: "RISK",
        title: "Capital Underexposure",
        description: "High deal volume but no new capital inflow. Potential liquidity issue for pending deals.",
        impactScore: 85,
        confidenceScore: 90,
        supportingDataJson: { deals: dealPipeline.volume, capital: investorActivity.newCapital }
      });
    }

    // 3. Financial Risk
    if (revenueStats.taxExposure === "HIGH") {
      insights.push({
        category: "RISK",
        title: "Elevated Tax Exposure",
        description: "Financial audits indicate high tax exposure in certain segments. Review compliance structure.",
        impactScore: 95,
        confidenceScore: 95,
        supportingDataJson: { exposure: revenueStats.taxExposure }
      });
    }

    return {
      insights,
      riskLevel: insights.length > 2 ? "HIGH" : insights.length > 0 ? "MEDIUM" : "LOW"
    };
  }
}
