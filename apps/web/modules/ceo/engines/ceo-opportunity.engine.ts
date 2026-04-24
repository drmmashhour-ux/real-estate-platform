export class CeoOpportunityEngine {
  static analyze(data: any) {
    const { esgStats, dealPipeline, crmStats } = data;

    const insights: any[] = [];

    // 1. ESG ROI Opportunity
    if (esgStats.avgScore < 50) {
      insights.push({
        category: "CAPITAL",
        title: "ESG Value Creation Opportunity",
        description: "Average portfolio ESG score is low. High ROI potential for energy-efficiency retrofits.",
        impactScore: 85,
        confidenceScore: 80,
        supportingDataJson: { avgScore: esgStats.avgScore }
      });
    }

    // 2. High-Yield Segments
    if (dealPipeline.closeRate > 0.2) {
      insights.push({
        category: "REVENUE",
        title: "High-Yield Market Segment Detected",
        description: "Certain sub-markets are closing at 2x the average rate. Allocate more sourcing resources here.",
        impactScore: 90,
        confidenceScore: 85,
        supportingDataJson: { closeRate: dealPipeline.closeRate }
      });
    }

    return {
      insights,
      topOpportunities: insights.map(i => i.title)
    };
  }
}
