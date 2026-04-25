/**
 * Internal compliance policy summary (Québec brokerage / OACIQ-oriented).
 * Not legal advice — aligns product behavior with documented mechanisms: disclosures, broker attestation, conflict workflows.
 */

export const COMPLIANCE_POLICY = {
  summary:
    "The platform supports licensed brokers with tooling, audit logs, and mandatory client disclosures. " +
    "Binding brokerage decisions are attested by the broker; automation assists but does not replace professional judgment.",

  brokerPlatformUse: {
    title: "How the broker uses the platform",
    bullets: [
      "Brokers use CRM, listings, offers, documents, and messaging to run transactions under their licence and brokerage rules.",
      "Client-facing steps (offers, contracts, key agreements) can require mandatory disclosure display and recorded acknowledgment where enforcement flags are on.",
      "The broker maintains transaction disclosure profiles (status, conflict, financial interest) so clients see accurate information before they commit.",
    ],
  },

  decisionControl: {
    title: "How decisions are controlled",
    bullets: [
      "Legally binding actions (e.g. publishing listings, submitting offers, generating or signing enforceable contracts) are gated on explicit broker confirmation where broker-decision enforcement is enabled.",
      "AI and automations produce drafts, suggestions, and checks only; they do not replace the broker’s duty to review, explain, and approve.",
      "Audit logs record broker attestations and disclosure events for operational review (e.g. OACIQ broker decision logs, client disclosure acknowledgments).",
    ],
  },

  automationVsManual: {
    title: "What is automated vs manual",
    automated: [
      "Workflow prompts, document assembly from templates, eligibility checks, and compliance rule packs (advisory signals).",
      "Logging and tagging of disclosure and broker-decision events for traceability.",
      "Tax line logging and internal finance snapshots where wired (operational, not a government filing).",
    ],
    manual: [
      "Broker judgment on representation, conflicts, and whether to proceed with a transaction.",
      "Client explanations, negotiation strategy, and final approval of binding documents.",
      "Escalations to OACIQ or others; regulator correspondence and any follow-up commitments.",
    ],
  },

  existingMechanisms: {
    title: "Related product mechanisms (reference)",
    items: [
      "OACIQ alignment layer: mapped rules in `oaciq_compliance_rules`, evaluated on deal creation, listing publication, and deal-linked document generation when `LECIPM_OACIQ_ALIGNMENT_ENFORCEMENT=1` — see `lib/compliance/oaciq/oaciq-alignment-layer.service.ts`.",
      "Client disclosure system: per-transaction profiles, mandatory flows (offer / contract / agreement), recorded acks — see `lib/compliance/oaciq/client-disclosure.ts`.",
      "Broker decision authority: attested confirmations for gated actions — see `lib/compliance/oaciq/broker-decision-authority.ts`.",
      "Conflict management: conflict flags on disclosure profiles, conflict check / disclosure logs in Prisma (`OaciqConflictCheck`, `OaciqConflictDisclosureLog`) and escalation UI patterns.",
      "Unified compliance rules registry — `modules/compliance/core/registry.ts` (OACIQ-oriented packs).",
    ],
  },
} as const;

export type CompliancePolicy = typeof COMPLIANCE_POLICY;

/** Phase 3 — outreach to OACIQ (or other regulator): copy-only templates; send from your official mailbox. */
export const OACIQ_OUTREACH_TEMPLATES = {
  requestGuidanceEmail: {
    suggestedSubject: "Demande d’orientation — cadre de conformité et utilisation d’outils numériques (courtier)",
    body: [
      "Bonjour,",
      "",
      "Je suis courtier immobilier résidentiel (OACIQ) et j’exploite / fais usage d’une plateforme transactionnelle pour soutenir mes dossiers (outils CRM, divulgations clients, journaux d’audit).",
      "",
      "Je sollicite une orientation de principe sur notre approche générale :",
      "- mécanismes de divulgation client et constats d’accusé de réception ;",
      "- attestation du courtier sur les actes engageants (publication, offres, documents, signature) ;",
      "- gestion des situations de conflit et pistes d’audit.",
      "",
      "Je ne demande pas une approbation de produit ; je souhaite valider que notre positionnement et nos contrôles internes sont cohérents avec vos attentes et les règles applicables.",
      "",
      "Seriez-vous en mesure d’indiquer le bon point de contact ou toute documentation que vous recommandez ?",
      "",
      "Cordialement,",
      "[Nom]",
      "[Permis OACIQ]",
      "[Coordonnées]",
    ].join("\n"),
  },
} as const;
