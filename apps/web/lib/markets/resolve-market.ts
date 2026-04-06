import { prisma } from "@/lib/db";
import { defaultMarketDefinition } from "./default";
import { syriaMarketDefinition } from "./syria";
import type { BookingMode, ContactDisplayMode, MarketCode, PaymentMode, ResolvedMarket } from "./types";

function envMarketHint(): MarketCode | null {
  const raw = (process.env.NEXT_PUBLIC_MARKET_CODE ?? "").trim().toLowerCase();
  if (raw === "syria") return "syria";
  if (raw === "default" || raw === "") return null;
  return null;
}

function deriveBookingMode(onlinePayments: boolean): BookingMode {
  return onlinePayments ? "standard" : "manual_first";
}

function derivePaymentMode(online: boolean, manualTracking: boolean): PaymentMode {
  if (online && manualTracking) return "mixed";
  if (online) return "online";
  return "manual";
}

/**
 * Loads singleton `PlatformMarketLaunchSettings` and merges with static market definitions.
 * Safe to call from server actions / Route Handlers; caches nothing (admin changes apply immediately).
 */
export async function getResolvedMarket(): Promise<ResolvedMarket> {
  const row = await prisma.platformMarketLaunchSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const envHint = envMarketHint();
  const useSyriaProfile = row.syriaModeEnabled || row.activeMarketCode === "syria" || envHint === "syria";

  const base = useSyriaProfile ? syriaMarketDefinition : defaultMarketDefinition;
  const code: MarketCode = useSyriaProfile ? "syria" : "default";

  const onlinePaymentsEnabled = row.onlinePaymentsEnabled;
  const manualPaymentTrackingEnabled = row.manualPaymentTrackingEnabled;
  const contactFirstEmphasis = row.contactFirstEmphasis;

  const bookingMode = deriveBookingMode(onlinePaymentsEnabled);
  const paymentMode = derivePaymentMode(onlinePaymentsEnabled, manualPaymentTrackingEnabled);
  const contactDisplayMode: ContactDisplayMode =
    contactFirstEmphasis || base.contactDisplayMode === "emphasized" ? "emphasized" : "standard";

  return {
    ...base,
    code,
    defaultCurrency: row.defaultDisplayCurrency?.trim() || base.defaultCurrency,
    onlinePaymentsEnabled,
    manualPaymentTrackingEnabled,
    contactFirstEmphasis: contactFirstEmphasis || base.contactFirstEmphasis,
    bookingMode,
    paymentMode,
    contactDisplayMode,
  };
}
