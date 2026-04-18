/**
 * Read-only normalization for routing — does not mutate inputs.
 */

import { extractLeadCity } from "@/lib/leads/timeline-helpers";
import { inferLeadIntentLabel } from "@/modules/leads/lead-monetization.service";
import type { BrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.types";

export type NormalizedRoutingLead = {
  intent: string;
  regionKey: string;
  regionLabel: string;
};

export type NormalizedRoutingBroker = {
  brokerId: string;
  name: string;
  regionKeys: string[];
  launchPersonaChoice: string | null;
  growthOutreachSegment: string | null;
};

function normKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeRoutingInputs(
  lead: {
    message: string;
    purchaseRegion: string | null;
    leadType: string | null;
    aiExplanation: unknown;
  },
  brokers: Array<{
    id: string;
    name: string | null;
    homeCity: string | null;
    homeRegion: string | null;
    launchPersonaChoice: string | null;
    growthOutreachSegment: string | null;
  }>,
  _brokerPerformance: ReadonlyMap<string, BrokerPerformanceSummary | null>,
): { lead: NormalizedRoutingLead; brokers: NormalizedRoutingBroker[] } {
  const city = extractLeadCity({ aiExplanation: lead.aiExplanation, message: lead.message });
  const pr = lead.purchaseRegion?.trim() ?? "";
  const regionLabel = [city, pr].filter(Boolean).join(" · ").trim();
  const regionKey = normKey(regionLabel);
  const intent = inferLeadIntentLabel({ leadType: lead.leadType, message: lead.message });

  const outBrokers: NormalizedRoutingBroker[] = brokers.map((b) => {
    const keys = [b.homeCity, b.homeRegion].map((x) => normKey(x ?? "")).filter(Boolean);
    return {
      brokerId: b.id,
      name: b.name?.trim() || "Broker",
      regionKeys: keys.length > 0 ? keys : [],
      launchPersonaChoice: b.launchPersonaChoice,
      growthOutreachSegment: b.growthOutreachSegment,
    };
  });

  void _brokerPerformance;

  return {
    lead: { intent, regionKey, regionLabel },
    brokers: outBrokers,
  };
}
