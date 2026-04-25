import { NextResponse } from "next/server";
import { getInvestorMetrics } from "@/modules/investor/metrics.service";
import { generateInvestorNarrative } from "@/modules/investor/narrative.engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getInvestorMetrics();
    const narrative = generateInvestorNarrative(metrics);

    const report = {
      title: "LECIPM Weekly Board Report",
      generatedAt: new Date().toISOString(),
      summary: narrative.highlights[0],
      metrics,
      narrative,
      disclaimer: "Real-time system data. Not financial advice."
    };

    // In a real system, we'd use a PDF generation library like puppeteer or react-pdf
    // For now, we return a structured JSON that could be consumed by a PDF generator
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
