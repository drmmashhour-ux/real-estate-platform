import {
  evaluateComplaintGovernanceRules,
  type ComplaintGovernanceFacts,
} from "@/lib/compliance/complaints/complaint-compliance-engine";

export type GuardrailFacts = Record<string, unknown>;

export type GuardrailEvaluation =
  | { allowed: true; outcome: "allowed"; severity: string; message?: string }
  | {
      allowed: false;
      outcome: "hard_blocked" | "soft_blocked" | "manual_review_required" | "warned";
      severity: string;
      reasonCode: string;
      message: string;
      manualReviewRequired?: boolean;
      overrideAllowed?: boolean;
    };

function mapComplaintGovernanceFacts(facts: GuardrailFacts): ComplaintGovernanceFacts {
  return {
    hasWrittenComplaintPolicy: facts.hasWrittenComplaintPolicy === true,
    complaintStatus: typeof facts.complaintStatus === "string" ? facts.complaintStatus : "new",
    hasClassificationReview: facts.hasClassificationReview === true,
    assignedOwnerUserId:
      typeof facts.assignedOwnerUserId === "string" && facts.assignedOwnerUserId.trim()
        ? facts.assignedOwnerUserId.trim()
        : null,
    daysOpen: typeof facts.complaintDaysOpen === "number" ? facts.complaintDaysOpen : 0,
    acknowledgeSlaDays: typeof facts.complaintAcknowledgeSlaDays === "number" ? facts.complaintAcknowledgeSlaDays : 5,
    complaintType: typeof facts.complaintType === "string" ? facts.complaintType : "other",
    routingDecision: typeof facts.routingDecision === "string" ? facts.routingDecision : null,
    resolutionNote: typeof facts.resolutionNote === "string" ? facts.resolutionNote : null,
    falseAdvertisingViolationLinked: facts.falseAdvertisingViolationLinked === true,
    repeatedComplaintPattern: facts.repeatedComplaintPattern === true,
    consumerProtectionExplained: facts.consumerProtectionExplained === true,
  };
}

function evaluateComplaintGovernanceGuardrail(facts: GuardrailFacts): GuardrailEvaluation {
  const outcomes = evaluateComplaintGovernanceRules(mapComplaintGovernanceFacts(facts));
  const fails = outcomes.filter((o) => o.level === "fail");
  const warns = outcomes.filter((o) => o.level === "warn");
  if (fails.length) {
    const f0 = fails[0];
    return {
      allowed: false,
      outcome: "hard_blocked",
      severity: "high",
      reasonCode: f0.code,
      message: f0.message,
    };
  }
  if (warns.length) {
    const w0 = warns[0];
    return {
      allowed: true,
      outcome: "allowed",
      severity: "medium",
      message: `${w0.code}: ${w0.message}`,
    };
  }
  return { allowed: true, outcome: "allowed", severity: "info" };
}

/**
 * Deterministic compliance guardrail evaluation (no AI). All regulated flows should run through
 * `enforceComplianceAction` which persists a `ComplianceGuardrailDecision` per evaluation.
 */
export function evaluateGuardrails(input: {
  moduleKey: string;
  actionKey: string;
  entityType: string;
  entityId?: string | null;
  actorType?: string | null;
  actorId?: string | null;
  facts: GuardrailFacts;
}): GuardrailEvaluation {
  const { moduleKey, actionKey, facts } = input;

  // LISTING PUBLICATION
  if (moduleKey === "listings" && actionKey === "publish_listing") {
    const hasSellerDeclaration = facts.hasSellerDeclaration === true;
    const sellerDeclarationStatus =
      typeof facts.sellerDeclarationStatus === "string" ? facts.sellerDeclarationStatus : "missing";
    const contractVersionInvalid = facts.contractVersionInvalid === true;
    const highRiskScore = facts.highRiskScore === true;

    if (!hasSellerDeclaration || sellerDeclarationStatus === "missing") {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "critical",
        reasonCode: "SELLER_DECLARATION_REQUIRED",
        message: "Listing publication blocked: seller declaration is required or incomplete.",
      };
    }

    if (contractVersionInvalid) {
      return {
        allowed: false,
        outcome: "soft_blocked",
        severity: "high",
        reasonCode: "CONTRACT_VERSION_INVALID",
        message: "Listing publication blocked: mandatory contract / form version requirements not met.",
        overrideAllowed: false,
      };
    }

    if (highRiskScore) {
      return {
        allowed: false,
        outcome: "manual_review_required",
        severity: "high",
        reasonCode: "LISTING_HIGH_RISK_REVIEW",
        message: "Listing publication requires manual compliance review due to elevated risk.",
        manualReviewRequired: true,
        overrideAllowed: false,
      };
    }

    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  // OFFER SUBMISSION
  if (moduleKey === "offers" && actionKey === "submit_offer") {
    if (facts.listingCompliant !== true) {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "critical",
        reasonCode: "LISTING_NOT_COMPLIANT",
        message: "Offer submission blocked: listing is not compliant.",
      };
    }

    if (facts.depositRequired === true && facts.trustDepositReady !== true) {
      return {
        allowed: false,
        outcome: "soft_blocked",
        severity: "high",
        reasonCode: "TRUST_DEPOSIT_REQUIRED",
        message: "Offer submission blocked until trust deposit workflow is ready.",
        overrideAllowed: false,
      };
    }

    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  // TRUST RELEASE / REFUND (release_deposit covers release + refund paths)
  if (moduleKey === "trust" && actionKey === "release_deposit") {
    if (facts.depositStatus === "disputed" || facts.depositStatus === "frozen") {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "critical",
        reasonCode: "DEPOSIT_RELEASE_FORBIDDEN",
        message: "Deposit release blocked: deposit is disputed or frozen.",
      };
    }

    if (facts.releaseRulePresent !== true) {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "critical",
        reasonCode: "RELEASE_RULE_REQUIRED",
        message: "Deposit release blocked: release rule is required.",
      };
    }

    if (facts.manualReviewRequired === true) {
      return {
        allowed: false,
        outcome: "manual_review_required",
        severity: "high",
        reasonCode: "MANUAL_REVIEW_REQUIRED_FOR_RELEASE",
        message: "Deposit release requires manual compliance review.",
        manualReviewRequired: true,
      };
    }

    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  // FINANCIAL RECORDING
  if (moduleKey === "financial" && actionKey === "record_receipt") {
    if (facts.receivedForType === "trust_deposit" && facts.fundsDestinationType !== "trust") {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "critical",
        reasonCode: "TRUST_FUNDS_MISCLASSIFIED",
        message: "Financial record blocked: trust funds cannot be classified as operating or platform revenue.",
      };
    }

    const payerName = typeof facts.payerName === "string" ? facts.payerName.trim() : "";
    const paymentMethod = typeof facts.paymentMethod === "string" ? facts.paymentMethod.trim() : "";
    const amountCents = typeof facts.amountCents === "number" ? facts.amountCents : 0;

    if (!payerName || !paymentMethod || !amountCents || amountCents <= 0) {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "high",
        reasonCode: "INCOMPLETE_FINANCIAL_RECORD",
        message: "Financial record blocked: payer, payment method, and positive amount are required.",
      };
    }

    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  if (moduleKey === "financial" && actionKey === "reverse_ledger_entry") {
    if (facts.reasonProvided !== true) {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "high",
        reasonCode: "REVERSAL_REASON_REQUIRED",
        message: "Ledger reversal blocked: a documented reason is required.",
      };
    }
    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  // COMPLAINT CLOSURE
  if (moduleKey === "complaints" && actionKey === "close_complaint") {
    if (!facts.routingDecision) {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "high",
        reasonCode: "ROUTING_DECISION_REQUIRED",
        message: "Complaint closure blocked: routing decision required before closure.",
      };
    }

    if (facts.humanReviewRequired === true && facts.humanReviewCompleted !== true) {
      return {
        allowed: false,
        outcome: "manual_review_required",
        severity: "high",
        reasonCode: "HUMAN_REVIEW_REQUIRED",
        message: "Complaint closure requires accountable human review.",
        manualReviewRequired: true,
      };
    }

    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  if (moduleKey === "complaints" && actionKey === "refer_complaint") {
    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  if (moduleKey === "complaints" && actionKey === "governance_eval") {
    return evaluateComplaintGovernanceGuardrail(facts);
  }

  if (moduleKey === "consumer_protection" && actionKey === "governance_eval") {
    return evaluateComplaintGovernanceGuardrail(facts);
  }

  if (moduleKey === "oaciq_collaboration" && actionKey === "governance_eval") {
    return evaluateComplaintGovernanceGuardrail(facts);
  }

  // CONTRACT / TRANSACTION RELEASE (broker execution path)
  if (moduleKey === "contracts" && actionKey === "approve_contract") {
    if (facts.releaseTransaction !== true) {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "high",
        reasonCode: "TRANSACTION_RELEASE_NOT_READY",
        message: "Contract approval / transaction release blocked: prerequisites not satisfied.",
      };
    }
    if (facts.aiGenerated === true && facts.brokerReviewed !== true) {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "high",
        reasonCode: "BROKER_REVIEW_REQUIRED",
        message: "AI-assisted release blocked until broker review is recorded.",
      };
    }
    /** Full LECIPM release gate (drafting execute). Legacy `release_transaction` does not set this. */
    if (facts.fullReleaseGate === true) {
      const need: Array<[keyof GuardrailFacts, string, string]> = [
        ["formOrderValid", "FORM_ORDER_INVALID", "Release blocked: mandatory form sequence incomplete."],
        ["draftValid", "DRAFT_INVALID", "Release blocked: draft validation failed."],
        ["noContradictions", "CONTRADICTION_DETECTED", "Release blocked: listing / draft contradiction."],
        ["sourceCoverageValid", "NO_SOURCE_CONTEXT", "Release blocked: draft is not source-grounded."],
        ["brokerReviewDone", "BROKER_REVIEW_REQUIRED", "Release blocked: broker review not recorded."],
        ["brokerSigned", "SIGNATURE_REQUIRED", "Release blocked: broker signature / completion missing."],
        ["documentHashPresent", "DOCUMENT_HASH_REQUIRED", "Release blocked: document hash missing."],
        ["dsLinked", "DS_LINK_REQUIRED", "Release blocked: seller declaration not linked."],
      ];
      for (const [key, reasonCode, message] of need) {
        if (facts[key] !== true) {
          return {
            allowed: false,
            outcome: "hard_blocked",
            severity: "critical",
            reasonCode,
            message,
          };
        }
      }
    }
    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  // AUDIT — seal bundle (block double-seal / mutation of sealed)
  if (moduleKey === "audit" && actionKey === "seal_export_bundle") {
    if (facts.bundleStatus === "sealed") {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "critical",
        reasonCode: "SEALED_BUNDLE_IMMUTABLE",
        message: "Action blocked: sealed export bundles are immutable.",
      };
    }
    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  if (moduleKey === "audit" && actionKey === "modify_sealed_bundle") {
    return {
      allowed: false,
      outcome: "hard_blocked",
      severity: "critical",
      reasonCode: "SEALED_BUNDLE_IMMUTABLE",
      message: "Action blocked: sealed export bundles are immutable.",
    };
  }

  // INSPECTION — only hard-block when a read-only inspection session is actively used for a write
  if (moduleKey === "inspection" && actionKey === "write_operation") {
    if (facts.readOnlyInspectionActive === true) {
      return {
        allowed: false,
        outcome: "hard_blocked",
        severity: "critical",
        reasonCode: "INSPECTION_MODE_READ_ONLY",
        message: "Action blocked: inspection mode is read-only.",
      };
    }
    return { allowed: true, outcome: "allowed", severity: "info" };
  }

  return { allowed: true, outcome: "allowed", severity: "info" };
}
