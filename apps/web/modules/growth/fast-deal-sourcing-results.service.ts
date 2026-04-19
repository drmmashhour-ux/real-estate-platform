/**
 * Broker sourcing — manual attribution helpers (no scraping / automation).
 */

import { recordFastDealSourceEvent } from "@/modules/growth/fast-deal-results.service";

export async function logBrokerSourcingSessionStarted(input: {
  platform: string;
  city: string;
  actorUserId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "broker_sourcing",
    sourceSubType: "session_started",
    actorUserId: input.actorUserId,
    metadata: { platform: input.platform, city: input.city },
  });
}

export async function logBrokerSourcingQueryCopied(input: {
  platform: string;
  query: string;
  city: string;
  actorUserId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "broker_sourcing",
    sourceSubType: "query_copied",
    actorUserId: input.actorUserId,
    metadata: { platform: input.platform, query: input.query, city: input.city },
  });
}

export async function logBrokerFoundManual(input: {
  platform: string;
  city: string;
  note?: string;
  actorUserId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "broker_sourcing",
    sourceSubType: "broker_found_manual",
    actorUserId: input.actorUserId,
    metadata: { platform: input.platform, city: input.city, ...(input.note ? { note: input.note } : {}) },
  });
}
