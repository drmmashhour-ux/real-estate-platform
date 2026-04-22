import { NextResponse } from "next/server";
import { requireCompanyInvestorApiAuth } from "@/lib/investor-company/api-auth";
import { buildMonthlyInvestorReportMarkdown } from "@/modules/investor-company/investor-company-metrics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCompanyInvestorApiAuth();
  if (!auth.ok) return auth.response;

  const md = await buildMonthlyInvestorReportMarkdown(new Date());
  const fname = `lecipm-investor-monthly-${new Date().toISOString().slice(0, 10)}.md`;

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
