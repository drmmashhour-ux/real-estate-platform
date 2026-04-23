import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import type {
  ContentAudience,
  ContentGoal,
  ContentItem,
  ContentNotification,
  ContentPlatform,
  ContentStatus,
  ContentType,
} from "./content-calendar.types";
import {
  loadMarketingContentStore,
  saveMarketingContentStore,
  uid,
  type MarketingContentStore,
} from "./content-calendar-storage";

const STATUS_ORDER: ContentStatus[] = [
  "IDEA",
  "SCRIPT",
  "READY",
  "SCHEDULED",
  "POSTED",
];

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  const i = STATUS_ORDER.indexOf(from);
  const j = STATUS_ORDER.indexOf(to);
  if (i < 0 || j < 0) return false;
  return j === i + 1 || j === i;
}

export function advanceStatus(item: ContentItem): ContentItem | null {
  const i = STATUS_ORDER.indexOf(item.status);
  if (i < 0 || i >= STATUS_ORDER.length - 1) return null;
  const next = STATUS_ORDER[i + 1]!;
  return updateContentItem(item.id, { status: next });
}

export function listContentItems(): ContentItem[] {
  const s = loadMarketingContentStore();
  return Object.values(s.items).sort((a, b) =>
    (b.updatedAtIso || "").localeCompare(a.updatedAtIso || "")
  );
}

export function getContentItem(id: string): ContentItem | undefined {
  return loadMarketingContentStore().items[id];
}

export type CreateContentInput = {
  title: string;
  type: ContentType;
  platform: ContentPlatform;
  hook?: string;
  script?: string;
  caption?: string;
  audience: ContentAudience;
  goal: ContentGoal;
  status?: ContentStatus;
  scheduledDate?: string;
  assetUrl?: string;
};

export function createContentItem(input: CreateContentInput): ContentItem {
  const id = uid();
  const now = new Date().toISOString();
  const status = input.status ?? "IDEA";
  const scheduledDate =
    input.scheduledDate ??
    (status === "SCHEDULED" ? format(new Date(), "yyyy-MM-dd") : undefined);
  const postedDate = status === "POSTED" ? now : undefined;
  const item: ContentItem = {
    id,
    title: input.title.trim(),
    type: input.type,
    platform: input.platform,
    hook: input.hook ?? "",
    script: input.script ?? "",
    caption: input.caption ?? "",
    audience: input.audience,
    goal: input.goal,
    status,
    scheduledDate,
    postedDate,
    performance: {
      views: 0,
      clicks: 0,
      leads: 0,
      revenueCents: 0,
      engagementScore: 0,
    },
    assetUrl: input.assetUrl,
    createdAtIso: now,
    updatedAtIso: now,
  };
  const s = loadMarketingContentStore();
  s.items[id] = item;
  saveMarketingContentStore(s);
  refreshNotifications();
  return item;
}

export function updateContentItem(
  id: string,
  patch: Partial<Omit<ContentItem, "id" | "performance">> & {
    performance?: Partial<ContentItem["performance"]>;
  }
): ContentItem | null {
  const s = loadMarketingContentStore();
  const cur = s.items[id];
  if (!cur) return null;
  const perf =
    patch.performance !== undefined
      ? { ...cur.performance, ...patch.performance }
      : cur.performance;
  const { performance: _p, ...rest } = patch;
  let mergedRest = { ...rest };
  if (patch.status !== undefined && patch.status !== cur.status) {
    const schedulingJump =
      patch.status === "SCHEDULED" &&
      !!(patch.scheduledDate ?? cur.scheduledDate) &&
      cur.status !== "POSTED";
    if (!schedulingJump && !canTransition(cur.status, patch.status)) {
      return null;
    }
    if (patch.status === "SCHEDULED" && !(patch.scheduledDate ?? cur.scheduledDate)) {
      mergedRest.scheduledDate = format(new Date(), "yyyy-MM-dd");
    }
    if (patch.status === "POSTED") {
      mergedRest.postedDate = new Date().toISOString();
    }
  }

  const next: ContentItem = {
    ...cur,
    ...mergedRest,
    performance: perf,
    updatedAtIso: new Date().toISOString(),
  };
  s.items[id] = next;
  saveMarketingContentStore(s);
  refreshNotifications();
  return next;
}

export function deleteContentItem(id: string): boolean {
  const s = loadMarketingContentStore();
  if (!s.items[id]) return false;
  delete s.items[id];
  saveMarketingContentStore(s);
  refreshNotifications();
  return true;
}

export function setContentStatus(id: string, status: ContentStatus): ContentItem | null {
  const cur = getContentItem(id);
  if (!cur) return null;
  return updateContentItem(id, { status });
}

export function rescheduleContent(id: string, scheduledDateIsoDay: string): ContentItem | null {
  const cur = getContentItem(id);
  if (!cur) return null;
  if (cur.status === "POSTED") {
    return updateContentItem(id, { scheduledDate: scheduledDateIsoDay });
  }
  let status = cur.status;
  if (status === "IDEA" || status === "SCRIPT" || status === "READY") {
    status = "SCHEDULED";
  }
  return updateContentItem(id, { scheduledDate: scheduledDateIsoDay, status });
}

export type ContentFilters = {
  platform?: ContentPlatform | "ALL";
  audience?: ContentAudience | "ALL";
};

export function filterItems(items: ContentItem[], f: ContentFilters): ContentItem[] {
  return items.filter((it) => {
    if (f.platform && f.platform !== "ALL" && it.platform !== f.platform) return false;
    if (f.audience && f.audience !== "ALL" && it.audience !== f.audience) return false;
    return true;
  });
}

/** Items whose scheduledDate falls on this calendar day (YYYY-MM-DD) */
export function itemsForDay(dayIso: string, items: ContentItem[]): ContentItem[] {
  return items.filter((it) => it.scheduledDate === dayIso);
}

export function itemsInRange(
  start: Date,
  end: Date,
  items: ContentItem[]
): ContentItem[] {
  return items.filter((it) => {
    if (!it.scheduledDate) return false;
    try {
      const d = parseISO(it.scheduledDate);
      return isWithinInterval(d, { start, end });
    } catch {
      return false;
    }
  });
}

export function weekDaysContaining(date: Date): string[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function monthDaysContaining(date: Date): string[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

/** AI-lite: caption from hook + audience tone */
export function generateCaptionSuggestion(item: Partial<Pick<ContentItem, "hook" | "audience" | "title">>): string {
  const hook = item.hook?.trim() || item.title?.trim() || "Your next move in real estate";
  const tone =
    item.audience === "INVESTOR"
      ? "ROI-focused"
      : item.audience === "BROKER"
        ? "professional network"
        : item.audience === "BUYER"
          ? "homebuyer-friendly"
          : "broad appeal";
  return `${hook}\n\nLearn more — link in bio.\n\n#RealEstate #BNHub (${tone})`;
}

export type ContentIdeaSuggestion = { hook: string; scriptOutline: string };

export function suggestContentIdeas(audience: ContentAudience, count = 3): ContentIdeaSuggestion[] {
  const bases: Record<ContentAudience, string[]> = {
    BROKER: [
      "Pipeline velocity",
      "Lead response time",
      "Commission clarity",
    ],
    INVESTOR: [
      "Yield vs risk",
      "Deal sourcing",
      "Portfolio diversification",
    ],
    BUYER: [
      "First viewing checklist",
      "Hidden costs decoded",
      "Neighbourhood fit",
    ],
    GENERAL: [
      "Market snapshot",
      "Behind the scenes",
      "Client win story",
    ],
  };
  const themes = bases[audience];
  const out: ContentIdeaSuggestion[] = [];
  for (let i = 0; i < Math.min(count, themes.length); i++) {
    const t = themes[i]!;
    out.push({
      hook: `${t}: what changes this quarter?`,
      scriptOutline: `Open with question → one stat → one actionable tip → CTA to contact.`,
    });
  }
  return out;
}

function pushNotification(store: MarketingContentStore, n: Omit<ContentNotification, "id" | "createdAtIso">) {
  const id = uid();
  store.notifications.unshift({
    ...n,
    id,
    createdAtIso: new Date().toISOString(),
  });
  store.notifications = store.notifications.slice(0, 50);
}

export function refreshNotifications(): ContentNotification[] {
  const s = loadMarketingContentStore();
  s.notifications = [];
  const items = Object.values(s.items);
  const today = format(new Date(), "yyyy-MM-dd");

  for (const it of items) {
    if (it.status === "SCHEDULED" && it.scheduledDate === today) {
      pushNotification(s, {
        kind: "ready_to_post",
        title: "Ready to post",
        body: `"${it.title}" is scheduled for today (${it.platform}).`,
        contentId: it.id,
      });
    }
    const perf = it.performance;
    const score = perf.views + perf.clicks * 2 + perf.leads * 50;
    if (score >= 500 && it.status === "POSTED") {
      pushNotification(s, {
        kind: "high_performer",
        title: "High-performing content",
        body: `"${it.title}" is outperforming (${score} score). Consider a follow-up.`,
        contentId: it.id,
      });
    }
  }

  const hasToday = items.some((it) => it.scheduledDate === today && it.status !== "POSTED");
  if (!hasToday) {
    pushNotification(s, {
      kind: "missing_slot",
      title: "No content scheduled today",
      body: "Add a slot or move a draft to keep the calendar full.",
    });
  }

  saveMarketingContentStore(s);
  return s.notifications;
}

export function getNotifications(): ContentNotification[] {
  return loadMarketingContentStore().notifications;
}

export function isWorkingDay(date: Date): boolean {
  return true;
}

/** @internal test hook */
export function __setStoreForTests(store: MarketingContentStore): void {
  saveMarketingContentStore(store);
}
