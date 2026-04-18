/**
 * Advisory retention signals — no outbound sends; operator-controlled follow-up only.
 */

import { getBrokerPerformanceSummaries } from "./broker-performance.service";

const INACTIVE_MS = 3 * 24 * 60 * 60 * 1000;

export type RetentionSuggestion = {
  kind: "buy_more" | "inactive_followup" | "vip_priority";
  userId: string;
  email: string | null;
  title: string;
  detail: string;
};

/**
 * Rules: first-time buyer → suggest more; inactive 3d+ → follow-up; VIP → priority framing.
 */
export async function getBrokerRetentionSuggestions(max = 12): Promise<RetentionSuggestion[]> {
  const perf = await getBrokerPerformanceSummaries(40);
  const out: RetentionSuggestion[] = [];
  const now = Date.now();

  for (const b of perf) {
    if (out.length >= max) break;
    const lastMs = b.lastPurchaseAt ? new Date(b.lastPurchaseAt).getTime() : 0;

    if (b.isVip) {
      out.push({
        kind: "vip_priority",
        userId: b.userId,
        email: b.email,
        title: `VIP broker — ${b.email ?? b.userId.slice(0, 8)}`,
        detail:
          "High spend / volume: prioritize routing premium or time-sensitive leads in CRM; confirm they see new inventory first (manual ops).",
      });
      continue;
    }

    if (b.leadsPurchased === 1) {
      out.push({
        kind: "buy_more",
        userId: b.userId,
        email: b.email,
        title: `Suggest second unlock — ${b.email ?? "broker"}`,
        detail: "One paid unlock so far — nudge toward a second qualified lead while momentum is warm (no auto-charge).",
      });
      continue;
    }

    if (lastMs > 0 && now - lastMs >= INACTIVE_MS) {
      out.push({
        kind: "inactive_followup",
        userId: b.userId,
        email: b.email,
        title: `Inactive 3+ days — ${b.email ?? "broker"}`,
        detail: "No lead monetization in 3+ days — operator follow-up (email/call) to re-engage; no automated outreach sent.",
      });
    }
  }

  return out.slice(0, max);
}
