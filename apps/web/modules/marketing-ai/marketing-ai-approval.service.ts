import { format, parseISO } from "date-fns";

import type { ContentItem } from "@/modules/marketing-content/content-calendar.types";
import { createContentItem, updateContentItem } from "@/modules/marketing-content/content-calendar.service";

import type {
  GeneratedMarketingPack,
  MarketingAutonomyLevel,
  PlannedSlot,
  QueueItem,
} from "./marketing-ai.types";
import { uid, loadMarketingAiStore, saveMarketingAiStore } from "./marketing-ai-storage";

function dayIsoFromWeekStart(weekStartIso: string, dayOffset: number): string {
  const base = parseISO(`${weekStartIso}T12:00:00`);
  base.setDate(base.getDate() + dayOffset);
  return format(base, "yyyy-MM-dd");
}

export function enqueueSlot(
  slot: PlannedSlot,
  pack: GeneratedMarketingPack,
  weekStartIso: string,
  autonomy: MarketingAutonomyLevel
): QueueItem {
  const store = loadMarketingAiStore();
  const q: QueueItem = {
    id: uid(),
    planSlotId: slot.id,
    title: `${slot.platform} · ${slot.topic.slice(0, 40)}`,
    previewHook: pack.hook.slice(0, 140),
    platform: slot.platform,
    contentType: slot.contentType,
    audience: slot.audience,
    goal: slot.goal,
    scheduledDayIso: dayIsoFromWeekStart(weekStartIso, slot.dayOffset),
    suggestedSlot: slot.suggestedSlot,
    pack,
    status: "PENDING_APPROVAL",
    autonomySnapshot: autonomy,
    createdAtIso: new Date().toISOString(),
  };
  store.queue.unshift(q);
  saveMarketingAiStore(store);
  return q;
}

export function approveQueueItem(queueItemId: string, note?: string): QueueItem | null {
  const store = loadMarketingAiStore();
  const q = store.queue.find((x) => x.id === queueItemId);
  if (!q || q.status !== "PENDING_APPROVAL") return null;
  q.status = "APPROVED";
  q.decidedAtIso = new Date().toISOString();
  q.decisionNote = note;
  store.approvalLogs.unshift({
    id: uid(),
    queueItemId: q.id,
    decision: "APPROVED",
    atIso: new Date().toISOString(),
    note,
  });
  saveMarketingAiStore(store);
  return q;
}

export function rejectQueueItem(queueItemId: string, note?: string): QueueItem | null {
  const store = loadMarketingAiStore();
  const q = store.queue.find((x) => x.id === queueItemId);
  if (!q || q.status !== "PENDING_APPROVAL") return null;
  q.status = "REJECTED";
  q.decidedAtIso = new Date().toISOString();
  q.decisionNote = note;
  store.approvalLogs.unshift({
    id: uid(),
    queueItemId: q.id,
    decision: "REJECTED",
    atIso: new Date().toISOString(),
    note,
  });
  saveMarketingAiStore(store);
  return q;
}

/** Creates / updates calendar draft from an approved queue row */
export function materializeApprovedToCalendar(queueItemId: string): ContentItem | null {
  const store = loadMarketingAiStore();
  const q = store.queue.find((x) => x.id === queueItemId);
  if (!q || q.status !== "APPROVED") return null;

  if (q.contentItemId) {
    const updated = updateContentItem(q.contentItemId, {
      title: q.title,
      hook: q.pack.hook,
      script: q.pack.script,
      caption: `${q.pack.caption}\n\n${q.pack.cta}`,
      platform: q.platform,
      type: q.contentType,
      audience: q.audience,
      goal: q.goal,
      status: "SCHEDULED",
      scheduledDate: q.scheduledDayIso,
    });
    saveMarketingAiStore(store);
    return updated;
  }

  const item = createContentItem({
    title: q.title,
    type: q.contentType,
    platform: q.platform,
    hook: q.pack.hook,
    script: q.pack.script,
    caption: `${q.pack.caption}\n\n${q.pack.cta}`,
    audience: q.audience,
    goal: q.goal,
    status: "SCHEDULED",
    scheduledDate: q.scheduledDayIso,
  });
  q.contentItemId = item.id;
  saveMarketingAiStore(store);
  return item;
}
