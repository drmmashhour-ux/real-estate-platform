import {
  type CampaignFeedbackInsights,
  CAMPAIGN_FEEDBACK_MIN_CAMPAIGNS,
  type AdPlatform,
} from "@/lib/marketing/campaignFeedbackTypes";

export type FeedbackRow = {
  platform: string;
  audience: string;
  city: string | null;
  ctr: number;
  conversionRate: number;
  conversions: number;
};

const AUD: Array<"buyer" | "seller" | "host" | "broker"> = ["buyer", "seller", "host", "broker"];
const PLAT: AdPlatform[] = ["tiktok", "meta", "google"];

function normPlatform(p: string): AdPlatform {
  const x = p.trim().toLowerCase();
  if (x === "tiktok" || x === "meta" || x === "google") {
    return x;
  }
  return "meta";
}

function normAudience(a: string): (typeof AUD)[number] {
  const x = a.trim().toLowerCase();
  if (x === "buyer" || x === "seller" || x === "host" || x === "broker") {
    return x;
  }
  return "buyer";
}

/**
 * Pure aggregation for Order 88 unit tests and {@link getCampaignFeedbackInsights}.
 */
export function aggregateCampaignFeedbackFromRows(rows: FeedbackRow[]): CampaignFeedbackInsights {
  const n = rows.length;
  if (n === 0) {
    return {
      bestPlatform: null,
      bestAudience: null,
      bestCity: null,
      avgCtr: 0,
      avgConversionRate: 0,
      recommendation: "No simulated campaigns with performance yet. Run simulations to unlock feedback.",
      campaignsAnalyzed: 0,
      eligible: false,
    };
  }

  let totalCtr = 0;
  let totalCvr = 0;
  for (const r of rows) {
    totalCtr += r.ctr;
    totalCvr += r.conversionRate;
  }
  const avgCtr = totalCtr / n;
  const avgConversionRate = totalCvr / n;

  const byPlat = new Map<AdPlatform, { sum: number; c: number }>();
  for (const p of PLAT) {
    byPlat.set(p, { sum: 0, c: 0 });
  }
  const byAud = new Map<string, { sum: number; c: number }>();
  for (const a of AUD) {
    byAud.set(a, { sum: 0, c: 0 });
  }
  const convByCity = new Map<string, number>();

  for (const r of rows) {
    const pl = normPlatform(r.platform);
    const bp = byPlat.get(pl)!;
    bp.sum += r.ctr;
    bp.c += 1;

    const aud = normAudience(r.audience);
    const ba = byAud.get(aud)!;
    ba.sum += r.conversionRate;
    ba.c += 1;

    const c = r.city?.trim();
    if (c) {
      convByCity.set(c, (convByCity.get(c) ?? 0) + r.conversions);
    }
  }

  let bestPlatform: AdPlatform | null = null;
  let bestPlatAvg = -1;
  for (const p of PLAT) {
    const b = byPlat.get(p)!;
    if (b.c === 0) {
      continue;
    }
    const a = b.sum / b.c;
    if (a > bestPlatAvg) {
      bestPlatAvg = a;
      bestPlatform = p;
    }
  }

  let bestAudience: (typeof AUD)[number] | null = null;
  let bestAudAvg = -1;
  for (const a of AUD) {
    const b = byAud.get(a)!;
    if (b.c === 0) {
      continue;
    }
    const v = b.sum / b.c;
    if (v > bestAudAvg) {
      bestAudAvg = v;
      bestAudience = a;
    }
  }

  let bestCity: string | null = null;
  let bestConv = -1;
  for (const [city, conv] of convByCity) {
    if (conv > bestConv) {
      bestConv = conv;
      bestCity = city;
    }
  }
  if (bestConv <= 0) {
    bestCity = null;
  }

  const eligible = n >= CAMPAIGN_FEEDBACK_MIN_CAMPAIGNS;
  const recommendation = buildRecommendation(
    bestPlatform,
    bestAudience,
    bestCity,
    eligible
  );

  return {
    bestPlatform: eligible ? bestPlatform : null,
    bestAudience: eligible ? bestAudience : null,
    bestCity: eligible ? bestCity : null,
    avgCtr,
    avgConversionRate,
    recommendation,
    campaignsAnalyzed: n,
    eligible,
  };
}

function buildRecommendation(
  bestPlatform: AdPlatform | null,
  bestAudience: string | null,
  bestCity: string | null,
  eligible: boolean
): string {
  if (!eligible) {
    return "Run at least 3 completed simulations to apply automatic performance feedback to new ad copy.";
  }
  const parts: string[] = [];
  if (bestPlatform) {
    parts.push(`Your strongest simulated results skew toward ${bestPlatform}.`);
  }
  if (bestAudience) {
    parts.push(`Conversion rate is highest for ${bestAudience} audiences.`);
  }
  if (bestCity) {
    parts.push(`Top conversion volume in ${bestCity}.`);
  }
  if (parts.length === 0) {
    return "Keep running simulations to refine channel and city focus.";
  }
  return `Focus: ${parts.join(" ")} Apply these hints as suggestions only — no changes to past campaigns.`;
}
