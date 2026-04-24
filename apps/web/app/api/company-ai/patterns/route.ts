import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyAiAdmin } from "@/modules/company-ai/company-ai-api-guard";
import { detectCompanyPatterns } from "@/modules/company-ai/company-pattern-detection.engine";
import type { CompanyMetricsSnapshot } from "@/modules/company-ai/company-outcome-aggregator.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCompanyAiAdmin();
  if (!auth.ok) return auth.response;

  const monthly = await prisma.companyOutcomeWindow.findFirst({
    where: { periodType: "MONTHLY" },
    orderBy: { periodEnd: "desc" },
  });
  const metrics = (monthly?.metricsJson ?? null) as CompanyMetricsSnapshot | null;
  const patterns = detectCompanyPatterns(metrics);

  return NextResponse.json({ patterns, windowId: monthly?.id ?? null });
}
