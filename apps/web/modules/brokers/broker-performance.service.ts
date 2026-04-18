/**
 * V1 broker *acquisition* pipeline performance (in-memory prospect store).
 * For live DB revenue from lead_unlock, see `modules/growth/broker-performance.service`.
 */

import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";
import {
  findProspectByEmailLoose,
  incrementBrokerAcquisitionMetrics,
  listBrokerPipeline,
} from "@/modules/brokers/broker-pipeline.service";

export type BrokerPipelinePerformanceEvent =
  | "listing_added"
  | "lead_received"
  | "lead_unlocked"
  | "conversion";

export function updateBrokerPerformance(
  brokerProspectId: string,
  eventType: BrokerPipelinePerformanceEvent,
  options?: { revenueCad?: number },
): BrokerProspect | null {
  const rev = options?.revenueCad ?? 0;
  switch (eventType) {
    case "listing_added":
      return incrementBrokerAcquisitionMetrics(brokerProspectId, { listingsCount: 1 });
    case "lead_received":
      return incrementBrokerAcquisitionMetrics(brokerProspectId, { leadsReceived: 1 });
    case "lead_unlocked":
      return incrementBrokerAcquisitionMetrics(brokerProspectId, {
        leadsUnlocked: 1,
        revenueCad: rev > 0 ? rev : 0,
      });
    case "conversion":
      return incrementBrokerAcquisitionMetrics(brokerProspectId, {
        closedDealsCount: 1,
        revenueCad: rev > 0 ? rev : 0,
      });
    default:
      return null;
  }
}

export type BrokerPipelinePerformanceView = BrokerProspect & {
  conversionPercent: number;
};

export function getBrokerPerformance(brokerProspectId: string): BrokerPipelinePerformanceView | null {
  const p = listBrokerPipeline().find((x) => x.id === brokerProspectId);
  if (!p) return null;
  const leads = Math.max(0, p.leadsReceived ?? 0);
  const unlocked = Math.max(0, p.leadsUnlocked ?? 0);
  const conversionPercent = leads > 0 ? Math.round((unlocked / leads) * 1000) / 10 : 0;
  return { ...p, conversionPercent };
}

/** Sort by revenue, then unlocked leads. */
export function getTopPerformingBrokers(limit = 8): BrokerProspect[] {
  return [...listBrokerPipeline()]
    .sort((a, b) => {
      const ra = a.revenueGenerated ?? 0;
      const rb = b.revenueGenerated ?? 0;
      if (rb !== ra) return rb - ra;
      return (b.leadsUnlocked ?? 0) - (a.leadsUnlocked ?? 0);
    })
    .slice(0, limit);
}

/** After a real lead_unlock payment, attribute revenue to a prospect by broker email match. */
export function applyLeadUnlockToProspectByBrokerEmail(email: string, amountCad: number): BrokerProspect | null {
  const norm = email.trim().toLowerCase();
  if (!norm) return null;
  const prospect = findProspectByEmailLoose(norm);
  if (!prospect) return null;
  return incrementBrokerAcquisitionMetrics(prospect.id, {
    leadsUnlocked: 1,
    revenueCad: Math.max(0, amountCad),
  });
}
