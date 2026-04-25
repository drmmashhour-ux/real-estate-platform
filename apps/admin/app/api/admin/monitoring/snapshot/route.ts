import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { loadMonitoringSnapshot } from "@/lib/monitoring/load-monitoring-snapshot";
import type { MonitoringLocaleFilter, MonitoringMarketFilter, MonitoringTimeRange } from "@/lib/monitoring/types";

export const dynamic = "force-dynamic";

function parseRange(v: string | null): MonitoringTimeRange {
  if (v === "today" || v === "30d") return v;
  return "7d";
}

function parseLocale(v: string | null): MonitoringLocaleFilter {
  if (v === "en" || v === "fr" || v === "ar") return v;
  return "all";
}

function parseMarket(v: string | null): MonitoringMarketFilter {
  if (v === "syria" || v === "default") return v;
  return "all";
}

/** GET — full monitoring snapshot (ADMIN / ACCOUNTANT). */
export async function GET(req: Request) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdminSurface(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const snapshot = await loadMonitoringSnapshot({
    range: parseRange(url.searchParams.get("range")),
    locale: parseLocale(url.searchParams.get("locale")),
    market: parseMarket(url.searchParams.get("market")),
  });

  return Response.json(snapshot);
}
