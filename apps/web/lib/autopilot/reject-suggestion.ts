import { prisma } from "@/lib/db";
import { createOptimizationAuditLog } from "@/lib/autopilot/create-audit-log";

export async function rejectListingOptimizationSuggestion(input: {
  suggestionId: string;
  performedByUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await prisma.listingOptimizationSuggestion.findUnique({
    where: { id: input.suggestionId },
  });
  if (!s) return { ok: false, error: "Not found" };
  if (s.status !== "suggested" && s.status !== "approved") {
    return { ok: false, error: "Not pending" };
  }

  await prisma.listingOptimizationSuggestion.update({
    where: { id: s.id },
    data: { status: "rejected", updatedAt: new Date() },
  });

  await createOptimizationAuditLog({
    listingId: s.listingId,
    suggestionId: s.id,
    action: "rejected",
    oldValue: s.proposedValue,
    performedByUserId: input.performedByUserId,
  });

  return { ok: true };
}
