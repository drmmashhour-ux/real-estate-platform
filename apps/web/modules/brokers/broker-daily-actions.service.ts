import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";

export type PipelineCounts = Record<
  "new" | "contacted" | "replied" | "demo" | "converted" | "lost",
  number
>;

function countByStage(prospects: BrokerProspect[]): PipelineCounts {
  const counts: PipelineCounts = {
    new: 0,
    contacted: 0,
    replied: 0,
    demo: 0,
    converted: 0,
    lost: 0,
  };
  for (const p of prospects) {
    counts[p.stage] = (counts[p.stage] ?? 0) + 1;
  }
  return counts;
}

export type BrokerDailyActionsInput = {
  prospects: BrokerProspect[];
  /**
   * Optional: how many first-touch outreaches you logged today (operator-maintained).
   * When omitted, rules that depend on “today” use stage heuristics only.
   */
  contactedTodayCount?: number;
  /** CRM leads assigned in pipeline but not yet unlocked (checkout completed). */
  leadsWaitingUnlock?: number;
  /** Stripe-confirmed unlocks attributed in assignment log today (UTC date on unlockedAt). */
  leadsUnlockedToday?: number;
};

/**
 * 3–5 concise actions for daily ops — deterministic from pipeline + optional touch count.
 */
export function getBrokerDailyActions(input: BrokerDailyActionsInput): string[] {
  const prospects = input.prospects;
  const c = countByStage(prospects);
  const contactedToday = input.contactedTodayCount ?? 0;
  const lines: string[] = [];

  if (c.new >= 1 && contactedToday < 5) {
    lines.push("Contact 5 new brokers (or work through your “New” column until you hit 5 touches today).");
  } else if (c.new >= 1) {
    lines.push(`Work remaining prospects in “New” (${c.new} in queue).`);
  } else {
    lines.push("Add new broker prospects — keep the top of funnel full.");
  }

  if (c.contacted >= 1) {
    lines.push("Send follow-ups to contacted prospects who haven’t replied yet.");
  }

  if (c.replied >= 1 && c.demo < 1) {
    lines.push("Push 1 replied prospect to Demo (short LECIPM walkthrough).");
  } else if (c.replied >= 1) {
    lines.push("Keep momentum — schedule or run demos for warm replies.");
  }

  if (c.demo >= 1 && c.converted < 1) {
    lines.push("Close 1 broker — move Demo → Converted when they unlock or pay.");
  } else if (c.demo >= 1) {
    lines.push("Close another paying broker from your Demo column when ready.");
  }

  const waiting = input.leadsWaitingUnlock ?? 0;
  if (waiting >= 1) {
    lines.push(`Follow up on ${waiting} assigned lead(s) still waiting for broker unlock checkout.`);
  }

  const unlockedToday = input.leadsUnlockedToday ?? 0;
  if (unlockedToday === 0 && waiting >= 3) {
    lines.push("Revenue opportunity: several leads are assigned — prompt brokers to complete unlock.");
  }

  return lines.slice(0, 8);
}
