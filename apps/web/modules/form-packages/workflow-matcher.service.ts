import type { Deal, DealExecutionType } from "@prisma/client";
import { explainWorkflowHintDisclaimer } from "../deals/deal-explainer";
import type { DealWorkflowHint } from "../deals/deal.types";
import { findPackagesForDealType } from "./form-package.service";

type ExecMeta = {
  coOwnership?: "divided" | "undivided" | "none";
  transactionIntent?: string;
  needsAmendment?: boolean;
};

function parseMeta(raw: unknown): ExecMeta {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    coOwnership: o.coOwnership as ExecMeta["coOwnership"],
    transactionIntent: typeof o.transactionIntent === "string" ? o.transactionIntent : undefined,
    needsAmendment: o.needsAmendment === true,
  };
}

/**
 * Suggests a likely form package — broker must confirm against official requirements.
 */
export function suggestWorkflowPackage(deal: Deal): DealWorkflowHint {
  const meta = parseMeta(deal.executionMetadata);
  let dealType: DealExecutionType | null = deal.dealExecutionType ?? null;

  if (!dealType && meta.coOwnership === "divided") dealType = "divided_coownership_sale";
  if (!dealType && meta.needsAmendment) dealType = "amendment";
  if (!dealType) dealType = "residential_sale";

  const candidates = findPackagesForDealType(dealType);
  const top = candidates[0];
  const reasons: string[] = [
    `Deal execution type context: ${dealType}`,
    meta.coOwnership ? `Co-ownership hint: ${meta.coOwnership}` : "Co-ownership: not specified in metadata",
  ];
  if (top) reasons.push(`First matching registered package: ${top.name}`);

  return {
    packageKey: top?.packageKey ?? "promise_to_purchase_residential_qc",
    confidence: top ? 0.55 : 0.35,
    reasons,
    disclaimer: explainWorkflowHintDisclaimer(),
  };
}
