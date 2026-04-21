import { NextResponse } from "next/server";
import { buildPortfolioSummaryReport } from "@/modules/portfolio/portfolio-report.service";
import { requirePortfolioSession } from "../../_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

  try {
    const report = await buildPortfolioSummaryReport(auth.userId, auth.role);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "Unable to generate summary" }, { status: 500 });
  }
}
