import { handleInvestorReportGet } from "@/modules/revenue/report/investor-report-handler";

export const dynamic = "force-dynamic";

/** GET `/api/revenue/report` — signed-in BNHub host; PDF from live dashboard aggregates (Python ReportLab). Ignores `userId` query params; identity comes from session. */
export async function GET() {
  return handleInvestorReportGet();
}
