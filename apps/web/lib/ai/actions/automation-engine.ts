import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";
import type { AutomationRuleKey } from "./automation-rules";

const prisma = getLegacyDB();

/** Idempotent seed for automation admin UI — safe to call on every load. */
export async function syncAutomationRuleDefinitions(): Promise<void> {
  const defaults = [
    {
      key: "digest_weekly_metrics",
      name: "Weekly metrics digest",
      description: "Queued summary for platform admins (dry-run capable).",
      frequency: "weekly",
      enabled: false,
    },
    {
      key: "review_stale_approvals",
      name: "Review stale approvals",
      description: "Reminder when approval queue items age beyond SLA (shadow).",
      frequency: "on_demand",
      enabled: false,
    },
  ];

  try {
    for (const d of defaults) {
      await prisma.managerAiAutomationRule.upsert({
        where: { key: d.key },
        update: { name: d.name, description: d.description },
        create: {
          key: d.key,
          name: d.name,
          description: d.description,
          frequency: d.frequency,
          enabled: d.enabled,
        },
      });
    }
  } catch {
    /* DB unavailable in some CI slices */
  }
}

/** Shadow tick for a platform automation rule — audit log when the rule exists and is enabled. */
export async function runAutomationRule(
  key: AutomationRuleKey,
): Promise<{ ok: boolean; createdRecommendations: number }> {
  try {
    const rule = await prisma.managerAiAutomationRule.findUnique({ where: { key } });
    if (!rule?.enabled) return { ok: true, createdRecommendations: 0 };

    await prisma.managerAiActionLog.create({
      data: {
        actionKey: `automation_run:${key}`,
        targetEntityType: "platform_automation",
        targetEntityId: key,
        status: "executed",
        payload: { ruleKey: key },
      },
    });
    return { ok: true, createdRecommendations: 1 };
  } catch {
    return { ok: false, createdRecommendations: 0 };
  }
}
