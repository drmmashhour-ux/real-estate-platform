import { prisma } from "@/lib/db";
import { applyOptimizationSuggestionToListing } from "@/lib/autopilot/apply-suggestion-core";

export async function approveListingOptimizationSuggestion(input: {
  suggestionId: string;
  performedByUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await prisma.listingOptimizationSuggestion.findUnique({
    where: { id: input.suggestionId },
    include: { listing: { select: { ownerId: true } } },
  });
  if (!s) return { ok: false, error: "Not found" };
  if (s.status !== "suggested") return { ok: false, error: "Not pending" };

  return applyOptimizationSuggestionToListing({
    suggestionId: s.id,
    performedByUserId: input.performedByUserId,
    auditAction: "human_approved_applied",
  });
}
