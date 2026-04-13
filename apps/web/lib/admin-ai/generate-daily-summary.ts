import { AdminAiInsightPriority, AdminAiInsightType } from "@prisma/client";
import { polishAdminCopy } from "./llm-helpers";
import type { AdminAiInsightPayload, PlatformSignals } from "./types";

function fmtMoney(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function generateDailySummary(
  signals: PlatformSignals,
  runId: string
): Promise<AdminAiInsightPayload[]> {
  const revDelta = signals.revenue.totalCents7d - signals.revenue.totalCentsPrev7d;
  const visDelta = signals.traffic.visitors - signals.traffic.visitorsPrevWeek;
  const payDelta = signals.support.paymentFailures7d;

  const wins: string[] = [];
  if (revDelta > 0) wins.push(`Paid platform revenue up ${fmtMoney(revDelta)} vs prior 7d window.`);
  if (signals.conversion.paymentCompletions > 0) {
    wins.push(`${signals.conversion.paymentCompletions} funnel payment completions (7d).`);
  }
  if (signals.users.newBuyers7d + signals.users.newSellers7d > 0) {
    wins.push(
      `${signals.users.newBuyers7d} new buyer signups and ${signals.users.newSellers7d} new seller signups (7d).`
    );
  }

  const problems: string[] = [];
  if (revDelta < 0) problems.push(`Paid revenue down ${fmtMoney(-revDelta)} vs prior 7d.`);
  if (visDelta < 0) problems.push(`Tracked visitors down ${Math.abs(visDelta)} vs prior 7d.`);
  if (payDelta >= 3) problems.push(`${payDelta} failed platform payments (7d).`);
  if (signals.listings.highTrafficLowConversion.length >= 3) {
    problems.push(
      `${signals.listings.highTrafficLowConversion.length} listings show high traffic with very few contact clicks.`
    );
  }

  const priorities: string[] = [
    "Review payment failures and Stripe logs if failures are elevated.",
    "Prioritize document queues (OACIQ license pending, broker tax, FSBO slots).",
    "Spot-check high-traffic / low-conversion listings for content and trust signals.",
  ];

  const fallbackBody = [
    `**Executive snapshot (7d vs prior 7d)**`,
    `- Visitors (tracked): ${signals.traffic.visitors} (prior window: ${signals.traffic.visitorsPrevWeek})`,
    `- Paid revenue: ${fmtMoney(signals.revenue.totalCents7d)} (prior: ${fmtMoney(signals.revenue.totalCentsPrev7d)})`,
    `- New buyers / sellers (signups): ${signals.users.newBuyers7d} / ${signals.users.newSellers7d}`,
    `- Payment failures (7d): ${signals.support.paymentFailures7d}`,
    ``,
    `**Major wins**`,
    wins.length ? wins.map((w) => `- ${w}`).join("\n") : `- (none flagged automatically)`,
    ``,
    `**Problems**`,
    problems.length ? problems.map((p) => `- ${p}`).join("\n") : `- (none flagged automatically)`,
    ``,
    `**Top priorities**`,
    priorities.map((p) => `- ${p}`).join("\n"),
  ].join("\n");

  const factsJson = JSON.stringify({
    window: signals.window,
    comparison: signals.comparisonWindow,
    traffic: signals.traffic,
    revenue: {
      totalCents7d: signals.revenue.totalCents7d,
      totalCentsPrev7d: signals.revenue.totalCentsPrev7d,
    },
    users: {
      newBuyers7d: signals.users.newBuyers7d,
      newSellers7d: signals.users.newSellers7d,
    },
    support: signals.support,
    listingFlags: {
      highTrafficLowConversionCount: signals.listings.highTrafficLowConversion.length,
    },
  });

  const body = await polishAdminCopy({
    task: "Write a concise executive daily summary with wins, problems, and top 3 priorities. Use only FACTS_JSON.",
    factsJson,
    fallbackText: fallbackBody,
  });

  const row: AdminAiInsightPayload = {
    type: AdminAiInsightType.daily_summary,
    title: `Daily platform summary · ${signals.window.start} → ${signals.window.end}`,
    body,
    priority: AdminAiInsightPriority.medium,
    entityType: "funnel",
    entityId: null,
    metadataJson: {
      runId,
      kind: "daily_summary",
      wins,
      problems,
      priorities,
    },
  };

  return [row];
}
