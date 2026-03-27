import type {
  FinancialModelPayload,
  MonthlyBucket,
  RevenueBySource,
  RevenueSourceKey,
} from "./financial-model-types";

const DEMO_THRESHOLD_CENTS = 50_000;

/** Illustrative split when DB is empty — labeled demo in UI */
const DEMO_SHARE: Record<RevenueSourceKey, number> = {
  buyer: 0.12,
  seller: 0.18,
  bnhub: 0.35,
  broker: 0.15,
  rent: 0.18,
  other: 0.02,
};

function demoMonths(period: FinancialModelPayload["period"]): MonthlyBucket[] {
  const out: MonthlyBucket[] = [];
  const cur = new Date(period.start);
  cur.setUTCDate(1);
  const end = new Date(period.end);
  while (cur <= end) {
    const monthKey = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = cur.toLocaleString("en-CA", { month: "short", year: "numeric", timeZone: "UTC" });
    out.push({ monthKey, label, cents: 0 });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  if (out.length === 0) {
    const k = `${period.start.getUTCFullYear()}-${String(period.start.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push({ monthKey: k, label: "Current", cents: 0 });
  }
  const totalDemo = 320_000_00;
  const per = Math.floor(totalDemo / out.length);
  return out.map((m, i) => ({ ...m, cents: per + (i === out.length - 1 ? totalDemo - per * out.length : 0) }));
}

export function applyDemoFinancialFallback(payload: FinancialModelPayload): FinancialModelPayload {
  if (payload.totalRevenueCents >= DEMO_THRESHOLD_CENTS) {
    return payload;
  }

  const totalCents = 320_000_00;
  const keys: RevenueSourceKey[] = ["buyer", "seller", "bnhub", "broker", "rent", "other"];
  const monthly = demoMonths(payload.period);
  const revenueBySource: RevenueBySource[] = keys.map((source) => ({
    source,
    label:
      source === "buyer"
        ? "Buyer"
        : source === "seller"
          ? "Seller"
          : source === "bnhub"
            ? "BNHub"
            : source === "broker"
              ? "Broker"
              : source === "rent"
                ? "Rent / deals"
                : "Other",
    totalCents: Math.round(totalCents * DEMO_SHARE[source]),
    monthly: monthly.map((m) => ({
      ...m,
      cents: Math.round(m.cents * DEMO_SHARE[source]),
    })),
  }));

  return {
    ...payload,
    revenueBySource,
    totalRevenueCents: totalCents,
    monthlyRevenueTotal: monthly,
    demoMode: true,
    bookingVolume: { count: 42, grossCents: 180_000_00 },
    userStats: {
      buyers: Math.max(payload.userStats.buyers, 800),
      sellers: Math.max(payload.userStats.sellers, 120),
      hosts: Math.max(payload.userStats.hosts, 60),
      brokers: Math.max(payload.userStats.brokers, 35),
      totalUsers: Math.max(payload.userStats.totalUsers, 1200),
    },
  };
}
