import { NextResponse } from "next/server";
import { requireCompanyAiAdmin } from "@/modules/company-ai/company-ai-api-guard";
import { generateMonthlyAdaptationReport } from "@/modules/company-ai/company-reflection-report.engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCompanyAiAdmin();
  if (!auth.ok) return auth.response;

  const report = await generateMonthlyAdaptationReport();
  return NextResponse.json(report);
}
