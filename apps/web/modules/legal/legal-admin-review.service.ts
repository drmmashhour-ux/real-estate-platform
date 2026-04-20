import { prisma } from "@/lib/db";
import type { LegalHubActorType } from "./legal.types";

export type LegalAdminReviewQueueItem = {
  workflowKey: string;
  label: string;
  count: number;
  severity: "info" | "warning" | "critical";
};

export type LegalAdminReviewQueue = {
  items: LegalAdminReviewQueueItem[];
  generatedAt: string;
  missingDataWarnings: string[];
};

export type LegalReviewNeedsSummary = {
  pendingVerificationListings: number;
  moderationRejectedListings: number;
  brokerPendingLicense: number;
  criticalHotspots: number;
  notes: string[];
};

/**
 * Read-only queue hints for operators (aggregates only).
 */
export async function buildLegalAdminReviewQueue(): Promise<LegalAdminReviewQueue> {
  const notes: string[] = [];
  const items: LegalAdminReviewQueueItem[] = [];
  const ts = new Date().toISOString();

  try {
    const [pendingVerification, rejectedMods, brokerPending] = await Promise.all([
      prisma.fsboListing.count({ where: { status: "PENDING_VERIFICATION" } }),
      prisma.fsboListing.count({ where: { moderationStatus: "REJECTED" } }),
      prisma.brokerVerification.count({ where: { verificationStatus: "PENDING" } }),
    ]);

    if (pendingVerification > 0) {
      items.push({
        workflowKey: "seller_disclosure",
        label: "FSBO listings awaiting verification",
        count: pendingVerification,
        severity: "warning",
      });
    }
    if (rejectedMods > 0) {
      items.push({
        workflowKey: "seller_disclosure",
        label: "FSBO listings rejected in moderation",
        count: rejectedMods,
        severity: "critical",
      });
    }
    if (brokerPending > 0) {
      items.push({
        workflowKey: "broker_mandate",
        label: "Broker licenses pending review",
        count: brokerPending,
        severity: "info",
      });
    }
  } catch {
    notes.push("Aggregate legal review metrics partially unavailable.");
  }

  const missingDataWarnings = [
    ...notes,
    "Cross-actor legal risk hotspots are not rolled up in this aggregate API (v1).",
  ];

  return { items, generatedAt: ts, missingDataWarnings };
}

export function summarizeLegalReviewNeeds(
  queue: LegalAdminReviewQueue,
  risksByActor: Partial<Record<LegalHubActorType, number>> | undefined,
): LegalReviewNeedsSummary {
  let pendingVerificationListings = 0;
  let moderationRejectedListings = 0;
  let brokerPendingLicense = 0;

  for (const it of queue.items) {
    if (it.label.includes("awaiting verification")) pendingVerificationListings = it.count;
    if (it.label.includes("rejected")) moderationRejectedListings = it.count;
    if (it.label.includes("Broker licenses")) brokerPendingLicense = it.count;
  }

  const criticalHotspots = Object.values(risksByActor ?? {}).reduce((a, b) => a + b, 0);

  return {
    pendingVerificationListings,
    moderationRejectedListings,
    brokerPendingLicense,
    criticalHotspots,
    notes: [],
  };
}
