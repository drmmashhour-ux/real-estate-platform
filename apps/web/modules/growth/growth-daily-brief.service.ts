/**
 * Daily Growth Brief — aggregates executive snapshot + UTM early-conversion windows (read-only).
 */

import { buildGrowthExecutiveSummary } from "./growth-executive.service";
import {
  computePaidFunnelAdsInsights,
  fetchEarlyConversionAdsSnapshot,
  fetchEarlyConversionYesterdayStats,
  type EarlyConversionAdsSnapshot,
  type EarlyConversionYesterdayStats,
} from "./growth-ai-analyzer.service";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthDailyBrief, GrowthDailyBriefStatus } from "./growth-daily-brief.types";
import { growthMemoryFlags } from "@/config/feature-flags";
import { buildGrowthMemoryBriefNotes } from "./growth-memory-brief-bridge.service";
import { buildGrowthMemorySummary } from "./growth-memory.service";
import {
  logGrowthDailyBriefStarted,
  recordGrowthDailyBriefBuild,
} from "./growth-daily-brief-monitoring.service";

const FALLBACK_PRIORITIES = [
  "Review new leads",
  "Check campaign performance",
  "Align CRM touchpoints with UTM signals",
] as const;

function padPriorities(titles: string[]): string[] {
  const out = [...titles];
  let i = 0;
  while (out.length < 3 && i < FALLBACK_PRIORITIES.length) {
    const f = FALLBACK_PRIORITIES[i]!;
    if (!out.includes(f)) out.push(f);
    i += 1;
  }
  return out.slice(0, 3);
}

function deriveFocus(exec: GrowthExecutiveSummary): string | undefined {
  const a = exec.autopilot?.focusTitle?.trim();
  if (a) return a;
  const t = exec.topPriority?.trim();
  if (t) return t;
  return undefined;
}

function deriveBlockers(args: {
  exec: GrowthExecutiveSummary;
  early: EarlyConversionAdsSnapshot | null;
  yesterday: EarlyConversionYesterdayStats | null;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (s: string) => {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };

  const leadsToday = args.early?.leadsToday ?? 0;
  if (leadsToday === 0) {
    push("No early-conversion leads in the current UTC day window");
  }

  if (args.yesterday && args.yesterday.leads === 0 && args.yesterday.campaignsActive > 0) {
    push("No early-conversion leads yesterday while UTM campaigns were active — verify tracking and landing paths");
  }

  const due = args.exec.leadSummary.dueNow ?? 0;
  if (due >= 1) {
    push(
      due >= 6
        ? "High follow-up backlog — multiple leads marked due now"
        : "Follow-up queue has items due now — prioritize CRM outreach",
    );
  }

  if (args.exec.leadSummary.hotLeads >= 8) {
    push("Large hot / high-score lead pool — ensure routing and capacity");
  }

  if (args.exec.campaignSummary.adsPerformance === "WEAK") {
    push("Campaign / funnel band is weak — review UTM attribution and landing conversion");
  }

  for (const p of args.exec.topRisks.slice(0, 2)) {
    push(p);
  }

  const insights = args.early ? computePaidFunnelAdsInsights(args.early) : null;
  for (const line of insights?.problems.slice(0, 1) ?? []) {
    push(`Ads insight: ${line}`);
  }

  return out.slice(0, 8);
}

function deriveNotes(args: {
  exec: GrowthExecutiveSummary;
  yesterday: EarlyConversionYesterdayStats | null;
  early: EarlyConversionAdsSnapshot | null;
}): string[] {
  const notes: string[] = [];

  if (args.yesterday && args.yesterday.leads > 0 && args.yesterday.topCampaign) {
    notes.push(`Yesterday lead volume driven largely by campaign “${args.yesterday.topCampaign}”.`);
  } else if (args.yesterday && args.yesterday.leads === 0) {
    notes.push("Low or zero early-conversion activity yesterday — confirm campaigns and form delivery.");
  }

  if (args.early && args.early.leadsToday > 0 && args.early.topCampaign) {
    notes.push(`Today’s early-conversion traffic still attributed (top UTM: ${args.early.topCampaign.label}).`);
  }

  if (args.exec.campaignSummary.topCampaign && args.exec.campaignSummary.topCampaign !== args.yesterday?.topCampaign) {
    notes.push("Lifetime top UTM campaign differs from yesterday’s leader — compare trends in ROI reports.");
  }

  if (notes.length === 0) {
    notes.push("Snapshot is stable — keep monitoring CRM and UTM dashboards for drift.");
  }

  return notes.slice(0, 5);
}

/**
 * Builds one daily brief. Reuses {@link buildGrowthExecutiveSummary} for priorities and status (no duplicated priority rules).
 */
export async function buildGrowthDailyBrief(): Promise<GrowthDailyBrief> {
  logGrowthDailyBriefStarted();
  const missingDataWarnings: string[] = [];

  let exec: GrowthExecutiveSummary;
  try {
    exec = await buildGrowthExecutiveSummary();
  } catch {
    missingDataWarnings.push("executive_unavailable");
    const now = new Date().toISOString();
    const stub: GrowthDailyBrief = {
      date: now.slice(0, 10),
      yesterday: { leads: 0, campaignsActive: 0 },
      today: {
        priorities: padPriorities([]),
        focus: undefined,
      },
      blockers: ["Executive snapshot unavailable — retry after data services recover"],
      notes: ["Partial data — brief degraded to safe defaults."],
      status: "watch",
      createdAt: now,
    };
    recordGrowthDailyBriefBuild({
      status: stub.status,
      priorityCount: stub.today.priorities.length,
      blockerCount: stub.blockers.length,
      missingDataWarnings: missingDataWarnings.length,
    });
    return stub;
  }

  let yesterday: EarlyConversionYesterdayStats | null = null;
  try {
    yesterday = await fetchEarlyConversionYesterdayStats();
  } catch {
    missingDataWarnings.push("yesterday_early_conversion_unavailable");
  }

  let early: EarlyConversionAdsSnapshot | null = null;
  try {
    early = await fetchEarlyConversionAdsSnapshot();
  } catch {
    missingDataWarnings.push("early_conversion_snapshot_unavailable");
  }

  const status = exec.status as GrowthDailyBriefStatus;
  const prios = padPriorities(exec.topPriorities.map((p) => p.title));
  const focus = deriveFocus(exec);
  const blockers = deriveBlockers({ exec, early, yesterday });
  const notes = deriveNotes({ exec, yesterday, early });

  const createdAt = new Date().toISOString();
  let briefNotes = notes;
  if (growthMemoryFlags.growthMemoryV1) {
    try {
      const mem = await buildGrowthMemorySummary();
      if (mem) {
        briefNotes = [...notes, ...buildGrowthMemoryBriefNotes(mem)].slice(0, 12);
      }
    } catch {
      /* optional memory cues */
    }
  }

  const brief: GrowthDailyBrief = {
    date: createdAt.slice(0, 10),
    yesterday: {
      leads: yesterday?.leads ?? 0,
      campaignsActive: yesterday?.campaignsActive ?? 0,
      topCampaign: yesterday?.topCampaign,
      conversionsStarted: yesterday?.conversionsStarted,
    },
    today: {
      priorities: prios,
      focus,
    },
    blockers,
    notes: briefNotes,
    status,
    createdAt,
  };

  recordGrowthDailyBriefBuild({
    status: brief.status,
    priorityCount: brief.today.priorities.length,
    blockerCount: brief.blockers.length,
    missingDataWarnings: missingDataWarnings.length,
  });

  return brief;
}
