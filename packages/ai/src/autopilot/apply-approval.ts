import { prisma } from "@/lib/db";
import { logManagerAction } from "@/lib/ai/logger";

type ListingPatchPayload = {
  kind?: string;
  patch?: { title?: string; description?: string };
};

/**
 * Applies an approved host-autopilot payload. Financial / payout actions are not executed here by design.
 */
export async function applyHostAutopilotApproval(input: {
  hostId: string;
  listingId: string;
  payload: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = input.payload as ListingPatchPayload;
  if (p?.kind === "listing_optimization_apply" && p.patch?.title && p.patch?.description) {
    const row = await prisma.shortTermListing.findFirst({
      where: { id: input.listingId, ownerId: input.hostId },
      select: { id: true },
    });
    if (!row) return { ok: false, error: "listing_not_found" };
    await prisma.shortTermListing.update({
      where: { id: input.listingId },
      data: {
        title: p.patch.title.slice(0, 200),
        description: p.patch.description.slice(0, 8000),
      },
    });
    await logManagerAction({
      userId: input.hostId,
      actionKey: "host_autopilot_listing_optimization_applied",
      targetEntityType: "short_term_listing",
      targetEntityId: input.listingId,
      status: "executed",
      payload: { via: "approval" },
    });
    return { ok: true };
  }
  /* pricing_suggestion and others: informational only — host edits listing manually */
  return { ok: true };
}
