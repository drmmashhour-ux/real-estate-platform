/**
 * Storage plan config: limits and prices. Used for upgrade flow and UserStorage.limitBytes.
 * Mock payment now → connect Stripe later.
 */

export const plans = {
  free: {
    storage: 500 * 1024 * 1024, // 500MB
    price: 0,
    label: "Free",
    storageLabel: "500MB",
  },
  basic: {
    storage: 5 * 1024 * 1024 * 1024, // 5GB
    price: 5,
    label: "Basic",
    storageLabel: "5GB",
  },
  pro: {
    storage: 50 * 1024 * 1024 * 1024, // 50GB
    price: 15,
    label: "Pro",
    storageLabel: "50GB",
  },
} as const;

export type PlanKey = keyof typeof plans;

export function getPlanStorage(plan: PlanKey): number {
  return plans[plan].storage;
}

export function getPlanPrice(plan: PlanKey): number {
  return plans[plan].price;
}
