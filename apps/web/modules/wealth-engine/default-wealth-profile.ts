import { ALLOCATION_BUCKET_KEYS, type WealthProfile } from "./wealth.types";
import { DEFAULT_BUCKET_LABELS, RISK_BAND_DEFAULT_TARGETS } from "./allocation.service";

export function createDefaultWealthProfile(): WealthProfile {
  const targets = RISK_BAND_DEFAULT_TARGETS.BALANCED;
  return {
    id: "demo",
    label: "Illustrative founder profile",
    riskBand: "BALANCED",
    /** $50M expressed in cents — editable in UI. */
    totalWealthCents: 5_000_000_000,
    buckets: ALLOCATION_BUCKET_KEYS.map((key) => ({
      key,
      label: DEFAULT_BUCKET_LABELS[key],
      targetWeight: targets[key],
      currentWeight: targets[key],
    })),
    liquidity: {
      monthsOfReserveCoverage: 18,
      liquidFraction: 0.22,
      liquidityNotes: "Self-reported; adjust to match your situation.",
    },
    primaryVentureWeight: 0.22,
    primaryMarketRegion: "North America (example)",
    dependencyNotes: "Example: primary liquidity events tied to one operating company.",
  };
}
