import type { LegalHubActorType, LegalWorkflowDefinition, LegalWorkflowType } from "./legal.types";

const COMMON_DISCLAIMER =
  "This checklist is operational guidance from the platform only. It is not legal advice and does not guarantee regulatory completeness for your situation. Consult a qualified professional where needed.";

function wf(
  type: LegalWorkflowType,
  partial: Omit<LegalWorkflowDefinition, "id" | "type">,
): LegalWorkflowDefinition {
  return { id: type, type, ...partial };
}

/**
 * Canonical catalog of workflow templates (Quebec-oriented where noted; expandable).
 */
export const LEGAL_WORKFLOW_DEFINITIONS: LegalWorkflowDefinition[] = [
  wf("seller_disclosure", {
    title: "Seller disclosure & listing accuracy",
    shortDescription:
      "Align seller declarations, material facts, and platform acknowledgments before publication or substantive marketing.",
    actors: ["seller"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: true,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "accuracy_ack",
        label: "Listing accuracy acknowledgment",
        description:
          "Confirm listing content reflects your knowledge; update when facts change (platform workflow — not statutory advice).",
      },
      {
        id: "material_updates",
        label: "Material fact review",
        description:
          "Review known defects and milestones relevant to buyers; keep records you would rely on in your jurisdiction.",
      },
      {
        id: "verification_gate",
        label: "Verification & publication readiness",
        description:
          "Complete identity and listing checks required by the platform before or after submission for review.",
        primaryActors: ["seller"],
      },
    ],
    recommendedDocuments: [
      { id: "seller_declaration", label: "Seller declaration / property questionnaire", detail: "As offered in product flows." },
      { id: "supporting_docs", label: "Supporting documents folder", detail: "Uploads you attach to the listing record." },
    ],
  }),
  wf("purchase_offer", {
    title: "Purchase offer preparation",
    shortDescription:
      "Prepare for an offer path: identity, platform terms, and broker/admin coordination where applicable.",
    actors: ["buyer", "broker", "admin"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: true,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "identity_ready",
        label: "Identity & account readiness",
        description: "Complete verification steps the platform requires for higher-risk transaction surfaces.",
      },
      {
        id: "terms_payment",
        label: "Platform transaction terms",
        description: "Acknowledge how offers, deposits, and platform fees are described in current terms.",
      },
      {
        id: "broker_coordination",
        label: "Broker coordination (if applicable)",
        description: "Confirm your broker relationship and any mandate details outside this UI with your licensee.",
        primaryActors: ["broker"],
      },
    ],
    recommendedDocuments: [
      { id: "oaciq_forms", label: "Licensee forms repository", detail: "Use your broker’s official forms for binding steps." },
    ],
  }),
  wf("lease_agreement", {
    title: "Lease & long-term rental compliance",
    shortDescription:
      "Structured steps for landlord and tenant flows: consent, lease documentation, and house rules alignment.",
    actors: ["landlord", "tenant"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: false,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "rental_terms",
        label: "Platform rental terms acknowledgment",
        description: "Acknowledge published BNHUB / long-term rental terms that apply to your use of rental tools.",
      },
      {
        id: "lease_doc",
        label: "Lease document status",
        description: "Track whether a written lease or equivalent record is associated with your tenancy workflow.",
      },
      {
        id: "rules_alignment",
        label: "Property rules alignment",
        description: "Confirm posted rules match how the tenancy is operated (workflow tracking only).",
      },
    ],
    recommendedDocuments: [
      { id: "lease_record", label: "Written lease or rental record", detail: "Maintain outside the platform as required locally." },
    ],
  }),
  wf("short_term_rental_compliance", {
    title: "Short-term rental compliance",
    shortDescription:
      "Hosting obligations: identity, hosting terms, payouts, and property rules suitable for guests.",
    actors: ["host"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: true,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "host_terms",
        label: "Hosting terms acceptance",
        description: "Accept current hosting terms before operating STR listings on the platform.",
      },
      {
        id: "identity_host",
        label: "Host identity verification",
        description: "Complete platform identity checks for payout and trust surfaces.",
      },
      {
        id: "property_rules_str",
        label: "Guest-facing property rules",
        description: "Publish clear rules for stays; update when amenities or restrictions change.",
      },
    ],
    recommendedDocuments: [
      { id: "house_rules", label: "House rules content", detail: "Shown to guests where product supports it." },
      { id: "local_registration", label: "Municipal / provincial registration", detail: "Track offline; platform does not file on your behalf." },
    ],
  }),
  wf("privacy_consent", {
    title: "Privacy & data processing",
    shortDescription: "Consent and notices for personal data processing on the platform.",
    actors: ["buyer", "seller", "landlord", "tenant", "broker", "host", "admin"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: false,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "privacy_policy",
        label: "Privacy policy acknowledgment",
        description: "Acknowledge the current privacy policy version applicable to your account.",
      },
      {
        id: "marketing_prefs",
        label: "Communications preferences",
        description: "Review optional marketing and notification settings where available.",
      },
    ],
    recommendedDocuments: [
      { id: "privacy_page", label: "Privacy policy", detail: "Published legal center." },
    ],
  }),
  wf("identity_verification", {
    title: "Identity verification",
    shortDescription: "Government ID and selfie flow where required for listings, payouts, or trust tiers.",
    actors: ["seller", "host", "broker", "buyer", "landlord", "tenant"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: true,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "submit_id",
        label: "Submit verification materials",
        description: "Provide documents requested by the verification UI.",
      },
      {
        id: "review_outcome",
        label: "Verification outcome",
        description: "Await platform review or resolve rejected items with new submissions.",
      },
    ],
    recommendedDocuments: [{ id: "id_specs", label: "ID capture guidelines", detail: "Follow on-screen instructions only." }],
  }),
  wf("tenant_screening_consent", {
    title: "Tenant screening consent",
    shortDescription:
      "Consent-related steps when rental applications or screening tools are used (workflow tracking only).",
    actors: ["tenant", "landlord"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: false,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "application_complete",
        label: "Application completeness",
        description: "Ensure required fields in rental applications are filled to proceed.",
      },
      {
        id: "consent_records",
        label: "Consent acknowledgments",
        description: "Confirm any consent prompts presented in-product were addressed.",
      },
    ],
    recommendedDocuments: [{ id: "rental_app", label: "Rental application record", detail: "As stored in platform metadata." }],
  }),
  wf("broker_mandate", {
    title: "Broker mandate & professional obligations",
    shortDescription:
      "Brokerage-side readiness: agreement acceptance, license verification, and listing access hygiene.",
    actors: ["broker"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: true,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "broker_agreement",
        label: "Broker agreement acceptance",
        description: "Accept the broker agreement governing platform collaboration.",
      },
      {
        id: "license_verification",
        label: "License verification status",
        description: "Ensure regulatory license verification reflects your current brokerage affiliation.",
      },
      {
        id: "listing_access_hygiene",
        label: "Listing access hygiene",
        description: "Revoke or confirm CRM listing access consistent with your mandates.",
      },
    ],
    recommendedDocuments: [{ id: "broker_agreement_doc", label: "Broker agreement", detail: "Legal center." }],
  }),
  wf("payment_terms", {
    title: "Payments & platform transaction terms",
    shortDescription:
      "Stripe, BNHub, or marketplace fees — acknowledge how charges, refunds, and payouts are described.",
    actors: ["buyer", "seller", "host", "tenant", "landlord", "broker"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: false,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "terms_service",
        label: "Terms of service",
        description: "Acknowledge governing terms including payment-related clauses.",
      },
      {
        id: "payout_ready",
        label: "Payout readiness (hosts/sellers)",
        description: "Complete payout onboarding where you receive funds via the platform.",
        primaryActors: ["host", "seller"],
      },
    ],
    recommendedDocuments: [{ id: "terms", label: "Terms of Service", detail: "Legal center." }],
  }),
  wf("property_rules", {
    title: "Property rules & conduct",
    shortDescription: "Guest and tenant-facing rules for stays and rentals.",
    actors: ["host", "landlord", "tenant"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: false,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "rules_published",
        label: "Rules published / accessible",
        description: "Ensure rules content is present where the product expects it.",
      },
      {
        id: "updates_logged",
        label: "Updates after changes",
        description: "Refresh rules after material property or amenity changes.",
      },
    ],
    recommendedDocuments: [{ id: "rules_copy", label: "Rules text", detail: "Maintained on listing or tenancy record." }],
  }),
  wf("risk_acknowledgement", {
    title: "Risk & limitation acknowledgements",
    shortDescription:
      "Platform acknowledgment surfaces: intermediary role, calculators, AI-assisted features — not substitutes for professionals.",
    actors: ["buyer", "seller", "broker", "host", "admin"],
    jurisdiction: "QC",
    brokerOrAdminReviewRequired: false,
    disclaimerText: COMMON_DISCLAIMER,
    requirements: [
      {
        id: "platform_ack",
        label: "Platform acknowledgment",
        description: "Acknowledge facilitator limitations and tool disclaimers as presented in-product.",
      },
      {
        id: "ai_tools",
        label: "AI-assisted tools",
        description: "Use AI outputs as drafts; human review remains your responsibility.",
      },
    ],
    recommendedDocuments: [{ id: "platform_ack_page", label: "Platform acknowledgment", detail: "Legal center." }],
  }),
];

const byType = new Map<LegalWorkflowType, LegalWorkflowDefinition>(
  LEGAL_WORKFLOW_DEFINITIONS.map((d) => [d.type, d]),
);

export function getLegalWorkflowDefinition(workflowType: LegalWorkflowType): LegalWorkflowDefinition | undefined {
  return byType.get(workflowType);
}

/** Workflows whose `actors` includes the given actor (deduped). */
export function resolveLegalWorkflowsForActor(actor: LegalHubActorType): LegalWorkflowDefinition[] {
  return LEGAL_WORKFLOW_DEFINITIONS.filter((w) => w.actors.includes(actor));
}
