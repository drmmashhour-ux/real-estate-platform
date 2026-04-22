import type { InvestorMetricRow } from "@/modules/investor-metrics/investor-metrics.types";

import type { NarrativeBlockKey, NarrativeBlockVm } from "./investor-pitch.types";

const ORDER: NarrativeBlockKey[] = [
  "problem",
  "solution",
  "product",
  "traction",
  "businessModel",
  "vision",
];

/**
 * Story engine — deterministic narrative blocks for investor materials (no fabricated metrics).
 */
export function buildNarrativeBlocks(opts: {
  sampleMode: boolean;
  metricsRows?: InvestorMetricRow[];
}): NarrativeBlockVm[] {
  const rows = opts.metricsRows ?? [];
  const userRow = rows.find((r) => r.metric === "total_users");
  const listingRow = rows.find((r) => r.metric === "total_live_listings");
  const bookingRow = rows.find((r) => r.metric === "bookings_confirmed_completed_30d");
  const revRow = rows.find((r) => r.metric === "revenue_events_sum_30d");

  const tractionLine =
    !opts.sampleMode && typeof userRow?.value === "number"
      ? `Registered users ${userRow.value}; live listings ${listingRow?.value ?? "—"}; 30d bookings activity ${bookingRow?.value ?? "—"}.`
      : opts.sampleMode
        ? "Illustrative traction — toggle off sample mode for DB-backed figures."
        : "Connect investor metrics APIs for auditable traction lines.";

  const blocks: Record<NarrativeBlockKey, Omit<NarrativeBlockVm, "key">> = {
    problem: {
      title: "Fragmented workflows erode trust and speed",
      paragraphs: [
        "Guests, buyers, and brokers still stitch together OTAs, spreadsheets, CRMs, and offline compliance.",
        "Liquidity suffers when discovery, contracting, and payouts are misaligned across channels.",
      ],
    },
    solution: {
      title: "LECIPM — one luxury OS across hubs",
      paragraphs: [
        "Multi-hub architecture maps real journeys: BNHub stays, resale & listings, residence discovery, investor capital rails.",
        "Shared identity and documents reduce handoffs while preserving brokerage and host autonomy where required.",
      ],
    },
    product: {
      title: "Product depth, not another thin wrapper",
      paragraphs: [
        "Operational modules span verification, calendars, payouts, CRM threads, and investor-grade reporting hooks.",
        "AI assists with review queues and drafts — escalation paths stay explicit for regulated contexts.",
      ],
    },
    traction: {
      title: "Traction grounded in telemetry",
      paragraphs: [tractionLine, `Revenue events (30d rollup): ${revRow?.value ?? "see export / finance"}.`],
    },
    businessModel: {
      title: "Marketplace take rates + SaaS surfaces",
      paragraphs: [
        "Take-rate on BNHub bookings, monetized lead access, subscriptions, and enterprise broker tooling as enabled.",
        "Designed for expandable ARPU as density compounds in priority metros.",
      ],
    },
    vision: {
      title: "Become the trusted operating layer for premium property journeys",
      paragraphs: [
        "Expand hub coverage with discipline: compliance-first, brand-consistent investor narrative.",
        "Compound data advantages without opaque black-box automation — governance as a feature.",
      ],
    },
  };

  return ORDER.map((key) => ({
    key,
    title: blocks[key].title,
    paragraphs: blocks[key].paragraphs,
  }));
}
