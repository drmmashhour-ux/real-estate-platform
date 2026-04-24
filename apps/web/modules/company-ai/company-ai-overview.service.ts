import { prisma } from "@/lib/db";
import {
  generateOutcomeWindowsForAnchor,
  loadLatestOutcomeWindows,
} from "./company-outcome-aggregator.service";
import { generateCompanyAdaptations } from "./company-adaptation.engine";
import { detectCompanyPatterns } from "./company-pattern-detection.engine";
import { loadTopPlaybookRules, loadWeakPlaybookRules } from "./company-playbook-memory.service";
import type { CompanyMetricsSnapshot } from "./company-outcome-aggregator.service";

const STALE_MS = Number(process.env.COMPANY_AI_OUTCOME_STALE_MS ?? String(36 * 3600 * 1000));

async function ensureFreshWindows(): Promise<void> {
  const latest = await prisma.companyOutcomeWindow.findFirst({ orderBy: { createdAt: "desc" } });
  if (!latest || Date.now() - latest.createdAt.getTime() > STALE_MS) {
    await generateOutcomeWindowsForAnchor(new Date());
  }
}

export async function getCompanyAiOverview(options?: { refreshAdaptations?: boolean }) {
  await ensureFreshWindows();
  if (options?.refreshAdaptations) {
    await generateCompanyAdaptations();
  }

  const windows = await loadLatestOutcomeWindows();
  const monthly = windows.MONTHLY?.metricsJson as CompanyMetricsSnapshot | undefined;
  const patterns = detectCompanyPatterns(monthly ?? null);

  const [proposed, topPlaybook, weakPlaybook, recentEvents] = await Promise.all([
    prisma.companyAdaptationEvent.findMany({
      where: { status: "PROPOSED" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    loadTopPlaybookRules(10),
    loadWeakPlaybookRules(6),
    prisma.companyAdaptationEvent.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 90 * 864e5) } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return {
    windows,
    patterns,
    proposedAdaptations: proposed,
    strategyMemoryTop: topPlaybook,
    strategyMemoryWeak: weakPlaybook,
    recentAdaptationEvents: recentEvents,
  };
}
