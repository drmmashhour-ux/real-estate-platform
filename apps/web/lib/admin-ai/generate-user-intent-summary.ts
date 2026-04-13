import {
  AdminAiEntityType,
  AdminAiInsightPriority,
  AdminAiInsightType,
} from "@prisma/client";
import { polishAdminCopy } from "./llm-helpers";
import type { AdminAiInsightPayload, PlatformSignals } from "./types";

export async function generateUserIntentSummary(
  signals: PlatformSignals,
  runId: string
): Promise<AdminAiInsightPayload[]> {
  const facts = {
    brokerAssisted: signals.users.brokerAssisted,
    selfSellers: signals.users.selfSellers,
    newBuyers7d: signals.users.newBuyers7d,
    documentBnhub: signals.users.documentHelpBnhub,
    documentFsbo: signals.users.documentHelpFsboListings,
    investors: signals.users.investors,
    funnel: signals.funnel.filter((f) =>
      ["contact_click", "payment_completed"].includes(f.name)
    ),
  };

  const fallback = [
    "**User & intent snapshot (from signals only)**",
    `- Broker-assisted selling modes: ${signals.users.brokerAssisted} users`,
    `- Self-serve sellers (free hub / unset mode): ${signals.users.selfSellers} users`,
    `- New buyer signups (7d): ${signals.users.newBuyers7d}`,
    `- Investor-role accounts: ${signals.users.investors}`,
    `- BNHub listings awaiting documents: ${signals.users.documentHelpBnhub}; FSBO listings with doc slots open: ${signals.users.documentHelpFsboListings}`,
    `- Funnel: contact clicks ${facts.funnel.find((x) => x.name === "contact_click")?.count7d ?? 0}, payments ${facts.funnel.find((x) => x.name === "payment_completed")?.count7d ?? 0} (7d)`,
    ``,
    `**Interpretation**`,
    `- Users requesting broker help are counted via seller selling mode (platform/preferred broker).`,
    `- “Stuck” self-sellers are not automatically detected in MVP — use FSBO doc + moderation queues as proxies.`,
  ].join("\n");

  const body = await polishAdminCopy({
    task: "Summarize user intent and support demand using only FACTS_JSON. No advice beyond operational interpretation.",
    factsJson: JSON.stringify(facts),
    fallbackText: fallback,
  });

  return [
    {
      type: AdminAiInsightType.user_intent_summary,
      title: "User intent & support demand",
      body,
      priority: AdminAiInsightPriority.medium,
      entityType: AdminAiEntityType.user,
      metadataJson: { runId, facts },
    },
  ];
}
