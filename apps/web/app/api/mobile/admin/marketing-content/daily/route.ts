import { PlatformRole } from "@prisma/client";
import { format, parseISO } from "date-fns";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import {
  buildMarketingContentDashboardSummaryFromItems,
  rankByPerformance,
} from "@/modules/marketing-content/content-performance.service";
import type { ContentItem } from "@/modules/marketing-content/content-calendar.types";
import { getServerMarketingContentStore } from "@/modules/marketing-content/content-calendar-server-store";

export const dynamic = "force-dynamic";

function itemsForCalendarDay(dayIso: string, items: ContentItem[]): ContentItem[] {
  return items.filter((it) => {
    if (it.scheduledDate === dayIso) return true;
    if (!it.postedDate) return false;
    try {
      return format(parseISO(it.postedDate), "yyyy-MM-dd") === dayIso;
    } catch {
      return false;
    }
  });
}

/** GET `/api/mobile/admin/marketing-content/daily?date=YYYY-MM-DD` — items + summary from server-synced store. */
export async function GET(request: Request) {
  try {
    const auth = await getMobileAuthUser(request);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (auth.role !== PlatformRole.ADMIN) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const raw = url.searchParams.get("date")?.trim();
    const dayIso = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : format(new Date(), "yyyy-MM-dd");

    const parsed = parseISO(`${dayIso}T12:00:00`);
    const store = getServerMarketingContentStore();
    const list = Object.values(store.items || {});
    const dayItems = itemsForCalendarDay(dayIso, list);
    const summary = buildMarketingContentDashboardSummaryFromItems(list, parsed);
    const top = rankByPerformance(list.filter((i) => i.status === "POSTED")).slice(0, 5);

    return Response.json({
      date: dayIso,
      items: dayItems,
      notifications: (store.notifications || []).slice(0, 20),
      summary,
      topPosted: top,
      note:
        list.length === 0
          ? "No items on server yet. Open Content Calendar on the web as admin — it syncs to the server after edits."
          : undefined,
    });
  } catch (e: unknown) {
    console.error("[Marketing Daily Error]", e);
    return Response.json(
      { error: "internal_server_error", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
