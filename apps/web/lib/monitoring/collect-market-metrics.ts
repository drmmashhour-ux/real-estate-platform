import { prisma } from "@/lib/db";
import type { MarketMetricsSlice } from "./types";

export async function collectMarketMetrics(start: Date, end: Date): Promise<MarketMetricsSlice> {
  const settings = await prisma.platformMarketLaunchSettings.findUnique({
    where: { id: "default" },
    select: {
      activeMarketCode: true,
      syriaModeEnabled: true,
      onlinePaymentsEnabled: true,
      manualPaymentTrackingEnabled: true,
    },
  });

  const rows = await prisma.$queryRaw<Array<{ mk: string | null; c: bigint }>>`
    SELECT COALESCE(properties->>'marketCode', 'unknown') AS mk, COUNT(*)::bigint AS c
    FROM growth_funnel_events
    WHERE created_at >= ${start} AND created_at <= ${end}
      AND event_name = 'market_mode_used'
    GROUP BY 1
    ORDER BY c DESC
  `;

  const funnelMarketSignals: Record<string, number> = {};
  for (const r of rows) {
    funnelMarketSignals[r.mk ?? "unknown"] = Number(r.c);
  }

  return {
    platformActiveMarketCode: settings?.activeMarketCode ?? null,
    syriaModeEnabled: settings?.syriaModeEnabled ?? null,
    onlinePaymentsEnabled: settings?.onlinePaymentsEnabled ?? null,
    manualPaymentTrackingEnabled: settings?.manualPaymentTrackingEnabled ?? null,
    funnelMarketSignals,
  };
}
