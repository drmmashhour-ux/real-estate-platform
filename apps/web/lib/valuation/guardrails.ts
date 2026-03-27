import { prisma } from "@/lib/db";
import { AVM_DISCLAIMER } from "./constants";

export interface GuardrailResult {
  allowed: boolean;
  fullReportAllowed: boolean;
  disclaimer: string;
  warnings: string[];
}

/**
 * Only verified properties get full valuation reports; others get restricted or disclaimer-heavy output.
 * Fraudulent or under-review properties are restricted.
 */
export async function checkValuationGuardrails(propertyIdentityId: string): Promise<GuardrailResult> {
  const warnings: string[] = [];
  const identity = await prisma.propertyIdentity.findUnique({
    where: { id: propertyIdentityId },
    select: {
      verificationScore: true,
      riskRecords: { orderBy: { lastEvaluatedAt: "desc" }, take: 1 },
    },
  });

  if (!identity) {
    return {
      allowed: false,
      fullReportAllowed: false,
      disclaimer: AVM_DISCLAIMER,
      warnings: ["Property identity not found."],
    };
  }

  const risk = identity.riskRecords[0];
  if (risk?.riskLevel === "high") {
    return {
      allowed: true,
      fullReportAllowed: false,
      disclaimer: AVM_DISCLAIMER + " This property has elevated risk flags; valuation is for reference only.",
      warnings: ["Property has high fraud risk. Use with caution."],
    };
  }

  if ((identity.verificationScore ?? 0) < 50) {
    warnings.push("Property verification is incomplete. Valuation may be less reliable.");
  }

  return {
    allowed: true,
    fullReportAllowed: (identity.verificationScore ?? 0) >= 50 && risk?.riskLevel !== "high",
    disclaimer: AVM_DISCLAIMER,
    warnings,
  };
}
