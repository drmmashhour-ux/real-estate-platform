import { prisma } from "@/lib/db";
import { buildCompanyInsights } from "../company-insights/company-insights.service";
import { buildFounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.service";
import type { CompanyMetricsWindow } from "../company-metrics/company-metrics.types";
import type { ExecutiveSession } from "../owner-access/owner-access.types";
import { executiveScopeToStored } from "../founder-intelligence/founder-scope";
import { founderIntelligenceDisclaimer } from "../founder-intelligence/founder-explainer";
import { buildWeeklyBriefingPayload, sectionsFromPayload } from "./briefing-section-builder.service";
import type { ExecutiveBriefingGeneratedSummary } from "./executive-briefing.types";

export async function generateWeeklyExecutiveBriefing(
  session: ExecutiveSession,
  window: CompanyMetricsWindow = "7d",
): Promise<{ briefingId: string }> {
  const snapshot = await buildFounderIntelligenceSnapshot(session.scope, window, session.userId);
  const { insights } = await buildCompanyInsights(snapshot);
  const payload = buildWeeklyBriefingPayload(snapshot, insights);

  const { scopeKind, scopeOfficeIdsJson } = executiveScopeToStored(session.scope);
  const summary: ExecutiveBriefingGeneratedSummary = {
    version: 1,
    payload,
    disclaimer: founderIntelligenceDisclaimer,
  };

  const start = new Date(payload.weekRange.start);
  const end = new Date(payload.weekRange.end);

  const briefing = await prisma.executiveBriefing.create({
    data: {
      scopeKind,
      scopeOfficeIdsJson: scopeOfficeIdsJson as object,
      periodType: "weekly",
      periodStart: start,
      periodEnd: end,
      status: "generated",
      generatedSummary: summary as object,
      createdByUserId: session.userId,
      sections: {
        create: sectionsFromPayload(payload).map((s) => ({
          sectionKey: s.sectionKey,
          title: s.title,
          content: s.content as object,
          ordering: s.ordering,
        })),
      },
    },
    select: { id: true },
  });

  return { briefingId: briefing.id };
}
