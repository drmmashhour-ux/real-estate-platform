/**
 * Global MOS view — **single-tenant metrics for this deployment** + explicit placeholders for other markets.
 * Does not fabricate cross-country revenue (strict isolation).
 */

import { getMosMarketRuntime, MOS_GLOBAL_MARKET_CODES } from "@/config/country";
import { buildMoneyOperatingSystemSnapshot } from "./money-os-aggregator.service";

export type GlobalMoneyMarketRow = {
  countryCode: string;
  label: string;
  isThisDeployment: boolean;
  revenueWeekCad: number | null;
  conversionUnlockRate: number | null;
  note?: string;
};

export async function buildGlobalMoneyOsView(): Promise<{
  markets: GlobalMoneyMarketRow[];
  topPerformerCode: string | null;
  weakestCode: string | null;
  isolationNote: string;
}> {
  const ctx = getMosMarketRuntime();
  const snap = await buildMoneyOperatingSystemSnapshot();
  const unlock =
    snap.meta.leadsViewedWeek > 0
      ? snap.meta.leadsUnlockedWeek / snap.meta.leadsViewedWeek
      : null;

  const markets: GlobalMoneyMarketRow[] = [
    {
      countryCode: ctx.countryCode,
      label: `Active deployment (${ctx.countryCode})`,
      isThisDeployment: true,
      revenueWeekCad: snap.revenueWeek,
      conversionUnlockRate: unlock,
    },
    ...MOS_GLOBAL_MARKET_CODES.filter((c) => c !== ctx.countryCode).map((c) => ({
      countryCode: c,
      label: `Isolated market (${c})`,
      isThisDeployment: false,
      revenueWeekCad: null,
      conversionUnlockRate: null,
      note:
        "Not in this database — run the country-specific app or connect a federation API; no numbers invented here.",
    })),
  ];

  return {
    markets,
    topPerformerCode: ctx.countryCode,
    weakestCode: null,
    isolationNote:
      "apps/web exposes one deployment. Compare countries only when each stack reports into a shared service you control.",
  };
}
