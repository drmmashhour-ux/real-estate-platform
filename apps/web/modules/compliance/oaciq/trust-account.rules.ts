import type { ComplianceCaseContext, ComplianceRule, ComplianceRuleResult } from "@/modules/compliance/core/rule-types";

function r(
  id: string,
  passed: boolean,
  severity: ComplianceRuleResult["severity"],
  code: string,
  title: string,
  message: string,
  blocking?: boolean,
  requiredActions?: string[],
): ComplianceRuleResult {
  return { ruleId: id, passed, severity, code, title, message, blocking, requiredActions };
}

export const trustAccountRules: ComplianceRule[] = [
  {
    id: "trust_account_required_for_client_funds",
    category: "trust",
    evaluate(ctx) {
      const clientMoney =
        ctx.transactionType === "deposit" ||
        ctx.transactionType === "trust_fund" ||
        ctx.transactionType === "cash_receipt";
      if (!clientMoney) return null;
      const exempt = ctx.metadata?.trustAccountExempt === true;
      if (exempt) {
        return r(
          "trust_account_required_for_client_funds",
          true,
          "low",
          "TRUST_EXEMPT",
          "Trust exemption documented",
          "Trust account requirement waived per documented legal exception/delegation.",
          false,
        );
      }
      const ok = Boolean(ctx.trustAccountId);
      return r(
        "trust_account_required_for_client_funds",
        ok,
        ok ? "low" : "critical",
        "TRUST_REQUIRED",
        "Trust account for client funds",
        ok ? "Trust account identified for client funds." : "Client funds must flow through a proper trust account unless exempt.",
        !ok,
      );
    },
  },
  {
    id: "trust_account_metadata_complete",
    category: "trust",
    evaluate(ctx) {
      if (!ctx.trustAccountId) return null;
      const ok = ctx.metadata?.trustAccountMetadataComplete === true;
      return r(
        "trust_account_metadata_complete",
        ok,
        ok ? "low" : "high",
        "TRUST_META",
        "Trust metadata",
        ok
          ? "Institution and account metadata complete."
          : "Complete institution, account number reference, and signatory metadata.",
        !ok,
      );
    },
  },
  {
    id: "payer_identified",
    category: "trust",
    evaluate(ctx) {
      if (!ctx.transactionType || !["deposit", "trust_fund", "cash_receipt"].includes(ctx.transactionType)) return null;
      const ok = Boolean(ctx.payer?.fullName?.trim());
      return r(
        "payer_identified",
        ok,
        ok ? "low" : "critical",
        "TRUST_PAYER",
        "Payer identified",
        ok ? "Payer identity captured." : "Identify payer for every trust or cash receipt movement.",
        !ok,
      );
    },
  },
  {
    id: "beneficiary_identified",
    category: "trust",
    evaluate(ctx) {
      if (ctx.transactionType !== "trust_fund" && ctx.transactionType !== "deposit") return null;
      const ok = Boolean(ctx.beneficiary?.fullName?.trim());
      return r(
        "beneficiary_identified",
        ok,
        ok ? "low" : "critical",
        "TRUST_BEN",
        "Beneficiary identified",
        ok ? "Beneficiary identified." : "Identify beneficiary for trust deposits.",
        !ok,
      );
    },
  },
  {
    id: "cash_receipt_required",
    category: "trust",
    evaluate(ctx) {
      if (ctx.paymentMethod !== "cash") return null;
      return r(
        "cash_receipt_required",
        true,
        "medium",
        "CASH_RECEIPT_REQ",
        "Official cash receipt",
        "Cash received — official receipt workflow is mandatory before progression.",
        false,
        ["Generate OACIQ-style cash receipt", "Retain immutable copy"],
      );
    },
  },
  {
    id: "cash_receipt_generated",
    category: "trust",
    evaluate(ctx) {
      if (ctx.paymentMethod !== "cash") return null;
      const ok = Boolean(ctx.documents?.cashReceiptFormId) || ctx.financialRecord?.receiptGenerated === true;
      return r(
        "cash_receipt_generated",
        ok,
        ok ? "low" : "critical",
        "CASH_RECEIPT_OK",
        "Cash receipt on file",
        ok ? "Cash receipt generated and linked." : "Complete official cash receipt before continuing.",
        !ok,
      );
    },
  },
  {
    id: "trust_funds_linked_to_contract",
    category: "trust",
    evaluate(ctx) {
      if (!["deposit", "trust_fund", "cash_receipt"].includes(ctx.transactionType ?? "")) return null;
      const ok = Boolean(ctx.contractId);
      return r(
        "trust_funds_linked_to_contract",
        ok,
        ok ? "low" : "critical",
        "TRUST_CONTRACT",
        "Mandate / contract linkage",
        ok ? "Funds linked to brokerage mandate or transaction file." : "Link trust movement to a legal mandate or contract record.",
        !ok,
      );
    },
  },
  {
    id: "trust_account_not_used_as_bank_account",
    category: "trust",
    evaluate(ctx) {
      if (ctx.metadata?.passThroughPattern === true) {
        return r(
          "trust_account_not_used_as_bank_account",
          false,
          "critical",
          "TRUST_PASSTHROUGH",
          "Pass-through misuse",
          "Trust account must not operate as generic pass-through — review and correct.",
          true,
        );
      }
      return null;
    },
  },
  {
    id: "trust_withdrawal_has_legal_basis",
    category: "trust",
    evaluate(ctx) {
      if (ctx.transactionType !== "refund" && ctx.metadata?.trustWithdrawal !== true) return null;
      const ok = ctx.metadata?.trustWithdrawalLegalBasis === true;
      return r(
        "trust_withdrawal_has_legal_basis",
        ok,
        ok ? "low" : "critical",
        "TRUST_WITHDRAW",
        "Withdrawal authority",
        ok ? "Withdrawal supported by documented legal basis." : "Document authority before trust withdrawal or offset.",
        !ok,
      );
    },
  },
  {
    id: "trust_supervision_controls_present",
    category: "trust",
    evaluate(ctx) {
      if (ctx.metadata?.trustSupervisionCheckRequired !== true) return null;
      const ok = ctx.metadata.trustSupervisionControlsPresent === true;
      return r(
        "trust_supervision_controls_present",
        ok,
        ok ? "low" : "high",
        "TRUST_SUPERVISION",
        "Trust supervision",
        ok ? "Supervisory controls for trust activity documented." : "Implement periodic trust review and sign-off.",
        !ok,
      );
    },
  },
];
