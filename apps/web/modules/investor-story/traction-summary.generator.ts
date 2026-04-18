import type { InvestorMetricRow } from "@/modules/investor-metrics/investor-metrics.types";

export type TractionSummary = {
  headline: string;
  bullets: string[];
  disclaimers: string[];
};

/** One-page bullets from metric rows — no adjectives beyond what numbers support. */
export function generateTractionSummary(rows: InvestorMetricRow[]): TractionSummary {
  const pick = (m: string) => rows.find((r) => r.metric === m)?.value;

  const users = pick("total_users");
  const active = pick("active_users_30d");
  const listings = pick("total_live_listings");
  const gmv = pick("gmv_booking_total_cents_30d");
  const rev = pick("revenue_events_sum_30d");

  const bullets: string[] = [];
  if (typeof users === "number") bullets.push(`Registered users (all time): ${users}.`);
  if (typeof active === "number") bullets.push(`Active users (rolling 30d, internal definition): ${active}.`);
  if (typeof listings === "number") bullets.push(`Live listings (BNHub + FSBO approved): ${listings}.`);
  if (typeof gmv === "number") bullets.push(`BNHub booking GMV (30d, cents, confirmed/completed): ${gmv}.`);
  if (typeof rev === "number") bullets.push(`Revenue events sum (30d): ${rev}.`);

  return {
    headline: "LECIPM traction snapshot — figures from internal ledger tables only.",
    bullets: bullets.length ? bullets : ["No metric rows supplied — run investor metric aggregation first."],
    disclaimers: [
      "This summary does not claim market share vs competitors.",
      "GMV is booking totals, not take-rate revenue unless finance maps fees separately.",
    ],
  };
}
