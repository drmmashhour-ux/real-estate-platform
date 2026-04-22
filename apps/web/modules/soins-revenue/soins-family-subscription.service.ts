import { FAMILY_ADDON_LIST_PRICES } from "./soins-revenue-catalog";
import type { SoinsFamilyAddonKey } from "./soins-revenue.types";

export { FAMILY_ADDON_LIST_PRICES } from "./soins-revenue-catalog";

export type FamilyAddonSelection = Partial<Record<SoinsFamilyAddonKey, boolean>>;

/** Monthly total for enabled family SaaS add-ons only. */
export function calculateFamilyAddonMonthlyTotal(selection: FamilyAddonSelection): number {
  let t = 0;
  for (const k of Object.keys(FAMILY_ADDON_LIST_PRICES) as SoinsFamilyAddonKey[]) {
    if (selection[k]) t += FAMILY_ADDON_LIST_PRICES[k];
  }
  return Math.round(t * 100) / 100;
}

/** Slots-based pricing: base includes 1 member; each extra slot adds MULTI_FAMILY_MEMBER_SLOT. */
export function priceMultiMemberSlots(extraMembersBeyondFirst: number): number {
  const n = Math.max(0, Math.floor(extraMembersBeyondFirst));
  return Math.round(n * FAMILY_ADDON_LIST_PRICES.MULTI_FAMILY_MEMBER_SLOT * 100) / 100;
}
