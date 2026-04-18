import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";

export type BrokerFollowUpSuggestion = {
  prospectId: string;
  reason: string;
  suggestedMessage: string;
};

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * Deterministic follow-up hints from pipeline state only (no invented engagement stats).
 */
export function listBrokerFollowUpSuggestions(prospects: BrokerProspect[]): BrokerFollowUpSuggestion[] {
  const now = Date.now();
  const out: BrokerFollowUpSuggestion[] = [];

  for (const p of prospects) {
    const parts: string[] = [];

    if (p.stage === "contacted") {
      parts.push("Still in Contacted — nudge for a reply or schedule.");
    }

    const lastMs = new Date(p.lastContactAt ?? p.updatedAt).getTime();
    if (Number.isFinite(lastMs) && now - lastMs > TWO_DAYS_MS && p.stage !== "converted" && p.stage !== "lost") {
      parts.push("No recorded outreach activity for 2+ days.");
    }

    if (parts.length === 0) continue;

    const fn = firstName(p.name);
    const suggestedMessage =
      p.stage === "contacted"
        ? `Hi ${fn} — quick check-in: did my last note land? If helpful, I can send 2 masked lead examples from your market or grab 10 minutes this week.`
        : `Hi ${fn} — bumping this up — still interested in routed leads + unlock billing? Morning or afternoon easier for a short call?`;

    out.push({
      prospectId: p.id,
      reason: parts.join(" "),
      suggestedMessage,
    });
  }

  return out.slice(0, 40);
}
