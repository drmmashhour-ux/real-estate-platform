import type { PlatformAutonomyEvent, PlatformAutomationRule } from "@prisma/client";
import { NotificationPriority, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { assertPlatformAutomationGate } from "@/lib/ai/autonomy/autonomy-state";
import { generateContent } from "@/lib/content-machine/generate";
import { runAutomationRule } from "@/lib/ai/actions/automation-engine";
import type { AutomationRuleKey } from "@/lib/ai/actions/automation-rules";

function payloadHasKeys(payload: unknown, keys: string[]): boolean {
  if (!payload || typeof payload !== "object") return false;
  const o = payload as Record<string, unknown>;
  return keys.every((k) => o[k] !== undefined && o[k] !== null);
}

function matchesCondition(
  event: PlatformAutonomyEvent,
  rule: PlatformAutomationRule,
): boolean {
  const raw = rule.conditionJson;
  if (raw == null || typeof raw !== "object") return true;
  const c = raw as { payloadHas?: string[]; payloadEquals?: Record<string, string> };
  if (Array.isArray(c.payloadHas) && c.payloadHas.length > 0) {
    if (!payloadHasKeys(event.payload, c.payloadHas)) return false;
  }
  if (c.payloadEquals && typeof c.payloadEquals === "object") {
    if (!event.payload || typeof event.payload !== "object") return false;
    const o = event.payload as Record<string, unknown>;
    for (const [k, v] of Object.entries(c.payloadEquals)) {
      if (o[k] !== v) return false;
    }
  }
  return true;
}

function interpolateTemplate(tpl: string, event: PlatformAutonomyEvent): string {
  return tpl
    .replace(/\{\{entityId\}\}/g, event.entityId ?? "—")
    .replace(/\{\{entityType\}\}/g, event.entityType ?? "—")
    .replace(/\{\{userId\}\}/g, event.userId ?? "—");
}

async function notifyAdmins(event: PlatformAutonomyEvent, rule: PlatformAutomationRule): Promise<void> {
  const settings = await getManagerAiPlatformSettings();
  if (settings.globalKillSwitch) return;

  const payload = rule.actionPayload as { titleTemplate?: string; bodyTemplate?: string } | null | undefined;
  const title = interpolateTemplate(payload?.titleTemplate ?? "Platform event", event).slice(0, 200);
  const message = interpolateTemplate(payload?.bodyTemplate ?? event.eventType, event).slice(0, 8000);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
    take: 5,
  });
  for (const a of admins) {
    await prisma.notification.create({
      data: {
        userId: a.id,
        type: NotificationType.SYSTEM,
        title,
        message,
        priority: NotificationPriority.NORMAL,
        metadata: { platformAutonomyEventId: event.id, ruleName: rule.name } as object,
      },
    });
  }
}

async function queueListingContent(listingId: string): Promise<void> {
  const gate = await assertPlatformAutomationGate("listings");
  if (!gate.ok) return;
  void generateContent(listingId, { force: false }).catch(() => {});
}

/**
 * Runs matching automation rules for a single event (idempotent: event should be unprocessed).
 */
export async function dispatchPlatformEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const event = await prisma.platformAutonomyEvent.findUnique({ where: { id: eventId } });
  if (!event || event.processedAt) return { ok: true };

  const rules = await prisma.platformAutomationRule.findMany({
    where: { enabled: true, eventType: event.eventType },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  try {
    for (const rule of rules) {
      if (!matchesCondition(event, rule)) continue;

      switch (rule.actionKind) {
        case "log_only":
          break;
        case "notify_admin":
          await notifyAdmins(event, rule);
          break;
        case "trigger_automation": {
          const p = rule.actionPayload as { automationKey?: string } | null | undefined;
          const key = p?.automationKey as AutomationRuleKey | undefined;
          if (key) {
            await runAutomationRule(key);
          }
          break;
        }
        case "queue_listing_content": {
          const pl = event.payload as { listingId?: string } | null | undefined;
          const listingId = pl?.listingId ?? event.entityId;
          if (listingId && event.entityType === "short_term_listing") {
            await queueListingContent(listingId);
          }
          break;
        }
        default:
          break;
      }
    }

    await prisma.platformAutonomyEvent.update({
      where: { id: eventId },
      data: { processedAt: new Date(), processingError: null },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "dispatch_failed";
    await prisma.platformAutonomyEvent.update({
      where: { id: eventId },
      data: { processingError: msg },
    });
    return { ok: false, error: msg };
  }
}

export async function processUnprocessedPlatformEvents(limit = 40): Promise<{ processed: number; failed: number }> {
  const rows = await prisma.platformAutonomyEvent.findMany({
    where: { processedAt: null },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });

  let processed = 0;
  let failed = 0;
  for (const r of rows) {
    const res = await dispatchPlatformEvent(r.id);
    if (res.ok) processed += 1;
    else failed += 1;
  }
  return { processed, failed };
}
