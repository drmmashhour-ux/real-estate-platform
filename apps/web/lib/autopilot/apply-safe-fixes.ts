import { prisma } from "@/lib/db";
import { applyOptimizationSuggestionToListing, suggestionEligibleForAutoApply } from "@/lib/autopilot/apply-suggestion-core";
import { FIELD_NIGHT_PRICE_CENTS } from "@/lib/autopilot/validators";

/**
 * Auto-apply all eligible suggestions for a listing (safe_autopilot + low-risk flags).
 */
export async function applySafeFixesForListing(input: {
  listingId: string;
  runId?: string;
  performedByUserId: string | null;
}): Promise<{ appliedIds: string[]; skipped: string[] }> {
  const where = {
    listingId: input.listingId,
    status: "suggested" as const,
    autoApplyAllowed: true,
    ...(input.runId ? { runId: input.runId } : {}),
  };

  const rows = await prisma.listingOptimizationSuggestion.findMany({
    where,
    select: {
      id: true,
      riskLevel: true,
      autoApplyAllowed: true,
      fieldType: true,
    },
  });

  const appliedIds: string[] = [];
  const skipped: string[] = [];

  for (const r of rows) {
    if (r.fieldType === FIELD_NIGHT_PRICE_CENTS) {
      skipped.push(r.id);
      continue;
    }
    if (!suggestionEligibleForAutoApply(r.riskLevel, r.autoApplyAllowed)) {
      skipped.push(r.id);
      continue;
    }
    const res = await applyOptimizationSuggestionToListing({
      suggestionId: r.id,
      performedByUserId: input.performedByUserId,
      auditAction: "auto_applied_safe",
    });
    if (res.ok) appliedIds.push(r.id);
    else skipped.push(r.id);
  }

  return { appliedIds, skipped };
}
