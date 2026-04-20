import type { LegalHubActorType, LegalHubContext, LegalRiskItem, LegalWorkflowType } from "./legal.types";
import { resolveLegalWorkflowsForActor } from "./legal-workflow-definitions";

function rid(workflow: LegalWorkflowType, suffix: string): string {
  return `${workflow}:${suffix}`;
}

/**
 * Deterministic compliance-style risk hints from platform signals (not legal advice).
 */
export function detectLegalRisks(context: LegalHubContext): LegalRiskItem[] {
  const out: LegalRiskItem[] = [];
  const { signals, actorType, requirementStates } = context;
  const workflows = resolveLegalWorkflowsForActor(actorType);
  const wfSet = new Set(workflows.map((w) => w.type));

  const reqStatus = (wf: LegalWorkflowType, reqId: string) =>
    requirementStates.find((s) => s.workflowType === wf && s.requirementId === reqId)?.status;

  if (signals.identityVerificationStatus !== "verified") {
    if (signals.identityVerificationStatus === "rejected") {
      out.push({
        id: rid("identity_verification", "rejected"),
        severity: "critical",
        title: "Identity verification needs attention",
        message:
          "Verification was rejected or requires resubmission. Complete the identity flow before high-trust listing or payout steps.",
        workflowType: "identity_verification",
        requirementId: "review_outcome",
      });
    } else {
      out.push({
        id: rid("identity_verification", "missing"),
        severity:
          actorType === "host" || actorType === "seller" || signals.hasPublishedOrSubmittedListing
            ? "critical"
            : "warning",
        title: "Identity verification incomplete",
        message:
          "Platform identity checks are not verified. Some listing, payout, or transaction surfaces may remain blocked.",
        workflowType: "identity_verification",
        requirementId: "submit_id",
      });
    }
  }

  if (!signals.privacyAccepted || !signals.termsAccepted) {
    out.push({
      id: rid("privacy_consent", "terms_privacy"),
      severity: "critical",
      title: "Terms or privacy acknowledgment missing",
      message: "Accept current Terms of Service and Privacy Policy to use regulated compliance workflows.",
      workflowType: "privacy_consent",
      requirementId: "privacy_policy",
    });
  }

  if (
    (actorType === "seller" || wfSet.has("seller_disclosure")) &&
    signals.hasPublishedOrSubmittedListing &&
    !signals.sellerLegalAccuracyAccepted
  ) {
    out.push({
      id: rid("seller_disclosure", "accuracy"),
      severity: "warning",
      title: "Seller disclosure checklist incomplete",
      message:
        "Listing accuracy acknowledgments may be pending. Review seller declarations before broader publication.",
      workflowType: "seller_disclosure",
      requirementId: "accuracy_ack",
    });
  }

  if (
    (actorType === "landlord" || actorType === "tenant") &&
    reqStatus("lease_agreement", "lease_doc") !== "approved" &&
    reqStatus("lease_agreement", "lease_doc") !== "submitted" &&
    reqStatus("lease_agreement", "lease_doc") !== "waived"
  ) {
    const hasLeaseSignal =
      signals.rentalLandlordListingCount > 0 || signals.rentalTenantApplicationCount > 0;
    if (hasLeaseSignal && reqStatus("lease_agreement", "lease_doc") === "not_started") {
      out.push({
        id: rid("lease_agreement", "lease_doc"),
        severity: "warning",
        title: "Lease documentation status unclear",
        message:
          "Track whether a written lease or equivalent record exists for your tenancy workflow outside this summary.",
        workflowType: "lease_agreement",
        requirementId: "lease_doc",
      });
    }
  }

  if (actorType === "host" && signals.shortTermListingCount > 0 && !signals.hostingTermsAccepted) {
    out.push({
      id: rid("short_term_rental_compliance", "host_terms"),
      severity: "critical",
      title: "Hosting terms not accepted",
      message: "Accept hosting terms for short-term listings before relying on STR compliance status.",
      workflowType: "short_term_rental_compliance",
      requirementId: "host_terms",
    });
  }

  if (
    actorType === "host" &&
    signals.shortTermListingCount > 0 &&
    reqStatus("property_rules", "rules_published") === "not_started"
  ) {
    out.push({
      id: rid("property_rules", "str_rules"),
      severity: "warning",
      title: "Property rules for guests",
      message: "Publish and maintain guest-facing house rules aligned with your listing.",
      workflowType: "property_rules",
      requirementId: "rules_published",
    });
  }

  if (actorType === "broker") {
    if (!signals.brokerAgreementAccepted) {
      out.push({
        id: rid("broker_mandate", "agreement"),
        severity: "critical",
        title: "Broker agreement not accepted",
        message: "Accept the broker agreement governing platform collaboration.",
        workflowType: "broker_mandate",
        requirementId: "broker_agreement",
      });
    }
    if (signals.brokerLicenseStatus !== "verified") {
      out.push({
        id: rid("broker_mandate", "license"),
        severity: signals.brokerLicenseStatus === "rejected" ? "critical" : "warning",
        title: "Broker license verification incomplete",
        message: "License verification is not in a verified state. Resolve with admin review if rejected.",
        workflowType: "broker_mandate",
        requirementId: "license_verification",
      });
    }
  }

  if (signals.fsboVerificationRejected) {
    out.push({
      id: rid("seller_disclosure", "fsbo_rejected"),
      severity: "critical",
      title: "Listing verification rejected",
      message: "A listing verification outcome requires resubmission or correction.",
      workflowType: "seller_disclosure",
      requirementId: "verification_gate",
    });
  }

  if (signals.fsboPendingAdminReview && (actorType === "seller" || actorType === "host")) {
    out.push({
      id: rid("seller_disclosure", "admin_review_pending"),
      severity: "info",
      title: "Administrative review pending",
      message: "A broker or operator review is pending for your submission.",
      workflowType: "seller_disclosure",
      requirementId: "verification_gate",
    });
  }

  const staleDays = 380;
  const stalePrivacy =
    signals.lastPrivacyAcceptedAt &&
    Date.now() - Date.parse(signals.lastPrivacyAcceptedAt) > staleDays * 86400000;
  if (stalePrivacy) {
    out.push({
      id: rid("privacy_consent", "stale"),
      severity: "info",
      title: "Reconfirm privacy acknowledgment",
      message: "Privacy acceptance timestamp is older than the platform refresh window — reconfirm when prompted.",
      workflowType: "privacy_consent",
      requirementId: "privacy_policy",
    });
  }

  if (
    workflows.some((w) => w.brokerOrAdminReviewRequired) &&
    signals.fsboPendingAdminReview &&
    actorType !== "admin"
  ) {
    out.push({
      id: "review_gate_pending",
      severity: "info",
      title: "Review gate active",
      message: "At least one workflow expects broker or admin review before certain steps finalize.",
    });
  }

  const rejectedReq = requirementStates.filter((s) => s.status === "rejected");
  for (const r of rejectedReq) {
    out.push({
      id: rid(r.workflowType, `rejected_${r.requirementId}`),
      severity: "critical",
      title: "Rejected requirement needs attention",
      message: `Workflow step "${r.requirementId}" was rejected — update and resubmit where the product allows.`,
      workflowType: r.workflowType,
      workflowId: r.workflowType,
      requirementId: r.requirementId,
    });
  }

  return dedupeRisks(out).map((item) =>
    item.workflowType ? { ...item, workflowId: item.workflowType } : item,
  );
}

function dedupeRisks(items: LegalRiskItem[]): LegalRiskItem[] {
  const seen = new Set<string>();
  const out: LegalRiskItem[] = [];
  for (const i of items) {
    const key = `${i.severity}:${i.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(i);
  }
  return out;
}
