import {
  AdminAiEntityType,
  AdminAiInsightPriority,
  AdminAiInsightType,
} from "@prisma/client";
import type { AdminAiInsightPayload, PlatformSignals } from "./types";

export async function generateRecommendations(
  signals: PlatformSignals,
  runId: string
): Promise<AdminAiInsightPayload[]> {
  const out: AdminAiInsightPayload[] = [];

  for (const l of signals.revenue.topListingEarners.slice(0, 3)) {
    out.push({
      type: AdminAiInsightType.recommendation,
      title: `Feature or promote top earner: ${l.label}`,
      body: `This listing generated about ${(l.cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} CAD in paid platform revenue (7d window in signals). Consider merchandising, SEO, or host follow-up.`,
      priority: AdminAiInsightPriority.medium,
      entityType: AdminAiEntityType.listing,
      entityId: l.listingId,
      metadataJson: {
        runId,
        href: l.kind === "fsbo" ? `/admin/fsbo/${l.listingId}` : `/admin/listings`,
        cents: l.cents,
        kind: l.kind,
      },
    });
  }

  if (signals.users.brokerAssisted > 0) {
    out.push({
      type: AdminAiInsightType.recommendation,
      title: "Broker-assisted sellers — ensure follow-up",
      body: `${signals.users.brokerAssisted} users are on platform/preferred broker selling modes. Align broker CRM tasks and visit scheduling.`,
      priority: AdminAiInsightPriority.medium,
      entityType: AdminAiEntityType.user,
      metadataJson: { runId, href: "/admin/brokers" },
    });
  }

  for (const p of signals.listings.missingPhotos.slice(0, 5)) {
    out.push({
      type: AdminAiInsightType.recommendation,
      title: `Add photos · FSBO ${p.title ?? p.id.slice(0, 8)}`,
      body: "Listing has no gallery images in signals. Strong hero photography typically improves conversion.",
      priority: AdminAiInsightPriority.high,
      entityType: AdminAiEntityType.listing,
      entityId: p.id,
      metadataJson: { runId, href: `/admin/fsbo/${p.id}` },
    });
  }

  if (signals.support.paymentFailures7d > 0) {
    out.push({
      type: AdminAiInsightType.recommendation,
      title: "Investigate checkout failures",
      body: `${signals.support.paymentFailures7d} failed platform payments in 7d. Review Stripe events and user-facing error paths.`,
      priority: AdminAiInsightPriority.high,
      entityType: AdminAiEntityType.payment,
      metadataJson: { runId, href: "/admin/finance" },
    });
  }

  if (signals.users.documentHelpFsboListings > 0 || signals.users.oaciqBrokerLicensePending > 0) {
    out.push({
      type: AdminAiInsightType.recommendation,
      title: "Clear document / OACIQ queues",
      body: `Open FSBO doc slots: ${signals.users.documentHelpFsboListings}. Broker license pending: ${signals.users.oaciqBrokerLicensePending}. Prioritize staff review.`,
      priority: AdminAiInsightPriority.high,
      entityType: AdminAiEntityType.document_request,
      metadataJson: { runId, href: "/admin/fsbo" },
    });
  }

  return out;
}
