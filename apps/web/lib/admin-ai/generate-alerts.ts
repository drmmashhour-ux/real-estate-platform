import {
  AdminAiEntityType,
  AdminAiInsightPriority,
  AdminAiInsightType,
} from "@prisma/client";
import type { AdminAiInsightPayload, PlatformSignals } from "./types";

const TRAFFIC_DROP_RATIO = 0.25;
const PAY_FAIL_MIN = 5;
const FORM_SPIKE_RATIO = 1.5;
const NO_LISTING_DAYS = 7;

export async function generateAlerts(
  signals: PlatformSignals,
  runId: string
): Promise<AdminAiInsightPayload[]> {
  const out: AdminAiInsightPayload[] = [];

  const visRatio =
    signals.traffic.visitorsPrevWeek > 0
      ? signals.traffic.visitors / signals.traffic.visitorsPrevWeek
      : 1;
  if (signals.traffic.visitorsPrevWeek > 20 && visRatio < 1 - TRAFFIC_DROP_RATIO) {
    out.push({
      type: AdminAiInsightType.alert,
      title: "Traffic drop vs prior week",
      body: `Tracked visitors are ${Math.round((1 - visRatio) * 100)}% lower than the prior 7d window (${signals.traffic.visitors} vs ${signals.traffic.visitorsPrevWeek}). Verify analytics tracking and marketing.`,
      priority: AdminAiInsightPriority.high,
      entityType: AdminAiEntityType.funnel,
      metadataJson: { runId, metric: "visitors", current: signals.traffic.visitors, prev: signals.traffic.visitorsPrevWeek },
    });
  }

  const payRate =
    signals.funnel.find((f) => f.name === "payment_completed")?.count7d ?? 0;
  const payPrev =
    signals.funnel.find((f) => f.name === "payment_completed")?.countPrev7d ?? 0;
  if (payPrev >= 5 && payRate < payPrev * 0.5) {
    out.push({
      type: AdminAiInsightType.alert,
      title: "Payment completions down sharply",
      body: `Funnel payment completions: ${payRate} (7d) vs ${payPrev} (prior 7d). Review checkout, Stripe health, and failed payments (${signals.support.paymentFailures7d} failures in 7d).`,
      priority: AdminAiInsightPriority.critical,
      entityType: AdminAiEntityType.payment,
      metadataJson: { runId, current: payRate, prev: payPrev },
    });
  }

  if (signals.support.paymentFailures7d >= PAY_FAIL_MIN) {
    out.push({
      type: AdminAiInsightType.alert,
      title: "Elevated payment failures",
      body: `${signals.support.paymentFailures7d} failed platform payments in the last 7 days. Inspect Stripe dashboard and webhook logs.`,
      priority: AdminAiInsightPriority.critical,
      entityType: AdminAiEntityType.payment,
      metadataJson: { runId, failures: signals.support.paymentFailures7d },
    });
  }

  const formRatio =
    signals.support.formSubmissionsPrev7d > 0
      ? signals.support.formSubmissions7d / signals.support.formSubmissionsPrev7d
      : 1;
  if (signals.support.formSubmissionsPrev7d > 5 && formRatio >= FORM_SPIKE_RATIO) {
    out.push({
      type: AdminAiInsightType.alert,
      title: "Form / intake submissions spiked",
      body: `Form submissions: ${signals.support.formSubmissions7d} (7d) vs ${signals.support.formSubmissionsPrev7d} (prior 7d). Review support load.`,
      priority: AdminAiInsightPriority.medium,
      entityType: AdminAiEntityType.support,
      metadataJson: { runId, current: signals.support.formSubmissions7d, prev: signals.support.formSubmissionsPrev7d },
    });
  }

  if (
    signals.listings.newlyActive7d === 0 &&
    signals.inventory.fsboNonDraftCount > 40
  ) {
    out.push({
      type: AdminAiInsightType.alert,
      title: "No new FSBO listings (7d)",
      body: `Zero new non-draft FSBO listings in the last ${NO_LISTING_DAYS} days while ${signals.inventory.fsboNonDraftCount} FSBO listings are live. Check acquisition and seller onboarding.`,
      priority: AdminAiInsightPriority.medium,
      entityType: AdminAiEntityType.listing,
      metadataJson: { runId, fsboNonDraftCount: signals.inventory.fsboNonDraftCount },
    });
  }

  const docLoad =
    signals.users.oaciqBrokerLicensePending +
    signals.users.brokerTaxPending +
    signals.users.documentHelpFsboListings;
  if (docLoad >= 15) {
    out.push({
      type: AdminAiInsightType.alert,
      title: "High document / compliance load",
      body: `Document queues: ${signals.users.oaciqBrokerLicensePending} broker license pending, ${signals.users.brokerTaxPending} broker tax in review, ${signals.users.documentHelpFsboListings} FSBO listings with open doc slots.`,
      priority: AdminAiInsightPriority.high,
      entityType: AdminAiEntityType.document_request,
      metadataJson: { runId, docLoad },
    });
  }

  for (const row of signals.listings.highTrafficLowConversion.slice(0, 3)) {
    out.push({
      type: AdminAiInsightType.alert,
      title: `High traffic, low contacts · ${row.kind} ${row.listingId.slice(0, 8)}…`,
      body: `About ${row.views} views with ${row.contacts} contact clicks in analytics. Inspect listing content, photos, and trust signals.`,
      priority: AdminAiInsightPriority.medium,
      entityType: AdminAiEntityType.listing,
      entityId: row.listingId,
      metadataJson: {
        runId,
        kind: row.kind,
        href:
          row.kind === "FSBO"
            ? `/admin/fsbo/${row.listingId}`
            : row.kind === "CRM"
              ? `/admin/listings`
              : `/admin/listings/stays`,
      },
    });
  }

  return out;
}
