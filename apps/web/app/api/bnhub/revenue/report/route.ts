import { handleInvestorReportGet } from "@/modules/revenue/report/investor-report-handler";

export const dynamic = "force-dynamic";

/** Alias of `GET /api/revenue/report` — same PDF payload. */
export async function GET() {
  return handleInvestorReportGet();
}
