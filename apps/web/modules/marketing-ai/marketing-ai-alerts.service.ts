import { format } from "date-fns";

import type { ContentItem } from "@/modules/marketing-content/content-calendar.types";

import type { MarketingAiAlert } from "./marketing-ai.types";
import { uid, loadMarketingAiStore, saveMarketingAiStore } from "./marketing-ai-storage";

function engagementScore(it: ContentItem): number {
  const p = it.performance;
  return p.views + p.clicks * 2 + p.leads * 50 + Math.floor(p.revenueCents / 100);
}

export function evaluateMarketingAiAlerts(items: ContentItem[]): MarketingAiAlert[] {
  const today = format(new Date(), "yyyy-MM-dd");
  const alerts: MarketingAiAlert[] = [];

  const scheduledToday = items.some(
    (it) => it.scheduledDate === today && it.status !== "POSTED"
  );
  if (!scheduledToday) {
    alerts.push({
      id: uid(),
      kind: "no_content_scheduled",
      title: "No calendar slot today",
      body: "Autonomous engine: add or approve a queued post so distribution stays consistent.",
      createdAtIso: new Date().toISOString(),
    });
  }

  for (const it of items) {
    if (it.status !== "POSTED") continue;
    const sc = engagementScore(it);
    if (sc >= 400) {
      alerts.push({
        id: uid(),
        kind: "high_performer",
        title: `High performer: ${it.title}`,
        body: `Score ~${sc}. Clone the angle for next week’s plan.`,
        relatedContentId: it.id,
        createdAtIso: new Date().toISOString(),
      });
    }
    if (sc > 0 && sc < 40 && it.performance.views > 200) {
      alerts.push({
        id: uid(),
        kind: "low_engagement_trend",
        title: `Low yield: ${it.title}`,
        body: "High views but weak downstream — tighten CTA or audience fit.",
        relatedContentId: it.id,
        createdAtIso: new Date().toISOString(),
      });
    }
  }

  const store = loadMarketingAiStore();
  store.alerts = alerts.slice(0, 25);
  saveMarketingAiStore(store);
  return store.alerts;
}
