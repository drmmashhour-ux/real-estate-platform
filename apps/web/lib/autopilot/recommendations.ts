export function generatePortfolioRecommendations(input: {
  properties: any[];
  health: {
    overallHealthScore: number;
    concentrationRisk: number;
    cashflowStrength: number;
    growthStrength: number;
    riskScore: number;
  };
}) {
  const recommendations: any[] = [];
  const properties = input.properties ?? [];

  for (const p of properties) {
    if ((p.monthlyCashflowCents ?? 0) < 0) {
      recommendations.push({
        recommendationType: "sell_review",
        priority: "high",
        title: `Review negative cashflow asset: ${p.address}`,
        description: "This property is producing negative monthly cashflow and may need repricing, restructuring, or disposal review.",
        propertyId: p.id,
        rationale: {
          monthlyCashflowCents: p.monthlyCashflowCents,
          riskLevel: p.riskLevel,
        },
      });
    }

    if ((p.dscr ?? 0) > 0 && (p.dscr ?? 0) < 1.1) {
      recommendations.push({
        recommendationType: "refinance_review",
        priority: "medium",
        title: `Review debt pressure: ${p.address}`,
        description: "Debt service coverage is weak. Review financing structure and debt resilience.",
        propertyId: p.id,
        rationale: {
          dscr: p.dscr,
        },
      });
    }

    if ((p.rankingScore ?? 0) >= 80 && (p.neighborhoodScore ?? 0) >= 75) {
      recommendations.push({
        recommendationType: "buy_more",
        priority: "medium",
        title: `Expand around strong asset: ${p.address}`,
        description: "This property performs strongly in a strong area. Consider searching for nearby expansion opportunities.",
        propertyId: p.id,
        rationale: {
          rankingScore: p.rankingScore,
          neighborhoodScore: p.neighborhoodScore,
        },
      });
    }

    if ((p.capRate ?? 0) < 0.04 && (p.roiPercent ?? 0) < 0.04) {
      recommendations.push({
        recommendationType: "improve",
        priority: "medium",
        title: `Improve underperforming yield: ${p.address}`,
        description: "Yield metrics are weak. Review rent optimization, expense control, and repositioning options.",
        propertyId: p.id,
        rationale: {
          capRate: p.capRate,
          roiPercent: p.roiPercent,
        },
      });
    }
  }

  if (input.health.concentrationRisk >= 55) {
    recommendations.push({
      recommendationType: "rebalance",
      priority: "high",
      title: "Portfolio concentration risk is elevated",
      description: "A large share of the portfolio is concentrated in too few assets. Consider diversification or staged reallocation.",
      rationale: {
        concentrationRisk: input.health.concentrationRisk,
      },
    });
  }

  if (input.health.cashflowStrength < 45) {
    recommendations.push({
      recommendationType: "rebalance",
      priority: "medium",
      title: "Portfolio cashflow strength is weak",
      description: "Consider prioritizing cashflow-positive assets or reducing weaker holdings.",
      rationale: {
        cashflowStrength: input.health.cashflowStrength,
      },
    });
  }

  return recommendations;
}
