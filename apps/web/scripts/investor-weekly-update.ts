import { getInvestorMetrics } from "../modules/investor/metrics.service";
import { generateInvestorNarrative } from "../modules/investor/narrative.engine";

async function generateWeeklyUpdate() {
  console.log("📈 Generating Weekly Investor Update...");

  try {
    const metrics = await getInvestorMetrics();
    const narrative = generateInvestorNarrative(metrics);

    const update = `
--------------------------------------------------
LECIPM WEEKLY BOARD UPDATE - ${new Date().toLocaleDateString()}
--------------------------------------------------

1. TOP HIGHLIGHTS
${narrative.highlights.map(h => `- ${h}`).join('\n')}

2. KEY METRICS
- Active Brokers: ${metrics.activeBrokers}
- Total Revenue: $${metrics.totalRevenueCad.toLocaleString()} CAD
- MoM Growth: ${(metrics.revenueGrowthMonthOverMonth * 100).toFixed(1)}%
- Conversion: ${(metrics.leadConversionRate * 100).toFixed(1)}%

3. FOCUS FOR NEXT WEEK
- Mitigating: ${narrative.risks[0]}
- Pursuing: ${narrative.opportunities[0]}

4. TRACTION NARRATIVE
"${narrative.traction}"

--------------------------------------------------
CONFIDENTIAL - INTERNAL USE ONLY
--------------------------------------------------
    `;

    console.log(update);
    console.log("✅ Update generated successfully.");
  } catch (error) {
    console.error("❌ Failed to generate weekly update:", error);
    process.exit(1);
  }
}

generateWeeklyUpdate();
