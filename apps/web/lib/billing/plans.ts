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
  platinum: {
    storage: 100 * 1024 * 1024 * 1024, // 100GB
    price: 39,
    label: "Platinum",
    storageLabel: "100GB",
  },
} as const;

export type PlanKey = keyof typeof plans;

/** Paid storage upgrade keys accepted by Stripe checkout + webhooks (excludes `free`). */
export const PAID_STORAGE_PLAN_KEYS: Array<Exclude<PlanKey, "free">> = ["basic", "pro", "platinum"];

export function getPlanStorage(plan: PlanKey): number {
  return plans[plan].storage;
}

export function getPlanPrice(plan: PlanKey): number {
  return plans[plan].price;
}
