import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveInvestigation, getInvestigation } from "@/lib/trust-safety/investigation-service";
import type { InvestigationResolution } from "@/lib/trust-safety/investigation-service";

const RESOLUTIONS: InvestigationResolution[] = [
  "restore_listing",
  "request_documents",
  "reject_listing",
  "permanently_remove",
  "suspend_user",
  "ban_user",
];

/**
 * POST /api/admin/listings/:id/investigation/resolve
 * Resolve an open investigation for this listing.
 * Body: { investigationId?: string, resolution, resolutionNotes?, publishAfterRestore?, requestMessage? }
 * If investigationId omitted, uses the most recent open investigation for this listing.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedBy = await getGuestId();
    if (!resolvedBy) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: listingId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const resolution = body?.resolution as InvestigationResolution | undefined;
    const investigationId = body?.investigationId as string | undefined;
    const resolutionNotes = body?.resolutionNotes;
    const publishAfterRestore = body?.publishAfterRestore === true;
    const requestMessage = body?.requestMessage;

    if (!resolution || !RESOLUTIONS.includes(resolution)) {
      return Response.json(
        { error: "resolution required and must be one of: " + RESOLUTIONS.join(", ") },
        { status: 400 }
      );
    }

    const { prisma } = await import("@repo/db");
    let invId = investigationId;
    if (!invId) {
      const open = await prisma.listingInvestigation.findFirst({
        where: { listingId, status: "OPEN" },
        orderBy: { openedAt: "desc" },
        select: { id: true },
      });
      if (!open) {
        return Response.json({ error: "No open investigation found for this listing" }, { status: 404 });
      }
      invId = open.id;
    }

    await resolveInvestigation({
      investigationId: invId,
      resolvedBy,
      resolution,
      resolutionNotes: resolutionNotes ?? undefined,
      publishAfterRestore,
      requestMessage: requestMessage ?? undefined,
    });

    const updated = await getInvestigation(invId);
    return Response.json({ success: true, investigation: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to resolve investigation";
    return Response.json({ error: message }, { status: 400 });
  }
}
