import { PRICING } from "./pricing";
import { exampleTenKCadModel, projectGrossRevenueCents } from "./projections";

export type MonetizationAdminSnapshot = {
  pricing: typeof PRICING;
  exampleModel: ReturnType<typeof exampleTenKCadModel>;
  projectedFromExampleCents: ReturnType<typeof projectGrossRevenueCents>;
  streams: Array<{ id: string; label: string; active: boolean }>;
  risks: string[];
  recommendation: string;
};

export function getMonetizationAdminSnapshot(): MonetizationAdminSnapshot {
  const exampleModel = exampleTenKCadModel();
  const projectedFromExampleCents = projectGrossRevenueCents(exampleModel);
  return {
    pricing: PRICING,
    exampleModel,
    projectedFromExampleCents,
    streams: [
      { id: "booking_commission", label: "Booking commission (% of GMV)", active: true },
      { id: "pay_per_lead", label: "Pay-per-lead (broker)", active: true },
      { id: "featured_listing", label: "Featured / promoted listings", active: true },
      { id: "host_subscription", label: "Host tiers (FREE / PRO / PLATINUM)", active: true },
    ],
    risks: [
      "Syria / manual-payment markets reduce instant booking_fee_collected velocity — monitor manual settlement lag.",
      "Lead definition must be contractually tight before scaling pay-per-lead.",
      "Featured inventory caps — avoid degrading trust if low-quality listings buy placement.",
    ],
    recommendation:
      "Validate booking fee + lead economics on first 100 trips; only then scale ads/influencers. Keep autonomy at ASSIST or SAFE_AUTOPILOT until error + payment health green for 30d.",
  };
}
