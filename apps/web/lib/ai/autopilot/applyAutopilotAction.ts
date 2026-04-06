import {
  AiAutopilotActionStatus,
  AiAutopilotActionType,
  ListingStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Execute a stored autopilot action with host/listing safety checks.
 */
export async function applyAutopilotAction(actionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const action = await prisma.aiAutopilotAction.findUnique({
    where: { id: actionId },
    include: { listing: true },
  });
  if (!action) return { ok: false, error: "Action not found" };
  if (action.status !== AiAutopilotActionStatus.PENDING && action.status !== AiAutopilotActionStatus.APPROVED) {
    return { ok: false, error: "Action not in an applicable state" };
  }

  const listing = action.listing;
  if (!listing || listing.listingStatus !== ListingStatus.PUBLISHED) {
    await prisma.aiAutopilotAction.update({
      where: { id: actionId },
      data: {
        status: AiAutopilotActionStatus.FAILED,
        resultPayload: { error: "Listing not published" } as object,
        executedAt: new Date(),
      },
    });
    return { ok: false, error: "Only published listings can be updated" };
  }

  try {
    switch (action.actionType) {
      case AiAutopilotActionType.UPDATE_PRICE: {
        const payload = (action.inputPayload ?? {}) as { nightPriceCents?: number };
        const cents = payload.nightPriceCents;
        if (typeof cents !== "number" || cents < 0) {
          throw new Error("Invalid nightPriceCents");
        }
        await prisma.shortTermListing.update({
          where: { id: listing.id },
          data: { nightPriceCents: Math.round(cents) },
        });
        await prisma.aiAutopilotAction.update({
          where: { id: actionId },
          data: {
            status: AiAutopilotActionStatus.EXECUTED,
            executedAt: new Date(),
            resultPayload: { nightPriceCents: Math.round(cents) } as object,
          },
        });
        return { ok: true };
      }
      case AiAutopilotActionType.CREATE_PROMOTION: {
        const p = (action.inputPayload ?? {}) as {
          discountPercent?: number;
          startDate?: string;
          endDate?: string;
          label?: string;
        };
        const pct = Math.min(50, Math.max(5, Math.round(p.discountPercent ?? 10)));
        const start = p.startDate ? new Date(p.startDate) : new Date();
        const end = p.endDate ? new Date(p.endDate) : new Date(Date.now() + 7 * 86400000);
        await prisma.bnhubHostListingPromotion.create({
          data: {
            listingId: listing.id,
            discountPercent: pct,
            startDate: start,
            endDate: end,
            label: p.label ?? "AI promotion",
            active: true,
          },
        });
        await prisma.aiAutopilotAction.update({
          where: { id: actionId },
          data: {
            status: AiAutopilotActionStatus.EXECUTED,
            executedAt: new Date(),
            resultPayload: { discountPercent: pct } as object,
          },
        });
        return { ok: true };
      }
      case AiAutopilotActionType.OPTIMIZE_TITLE: {
        const p = (action.inputPayload ?? {}) as { title?: string };
        if (!p.title?.trim()) throw new Error("Missing title");
        await prisma.shortTermListing.update({
          where: { id: listing.id },
          data: { title: p.title.trim().slice(0, 200) },
        });
        await prisma.aiAutopilotAction.update({
          where: { id: actionId },
          data: { status: AiAutopilotActionStatus.EXECUTED, executedAt: new Date(), resultPayload: { ok: true } as object },
        });
        return { ok: true };
      }
      case AiAutopilotActionType.OPTIMIZE_DESCRIPTION: {
        const p = (action.inputPayload ?? {}) as { description?: string };
        if (!p.description?.trim()) throw new Error("Missing description");
        await prisma.shortTermListing.update({
          where: { id: listing.id },
          data: { description: p.description.trim().slice(0, 20000) },
        });
        await prisma.aiAutopilotAction.update({
          where: { id: actionId },
          data: { status: AiAutopilotActionStatus.EXECUTED, executedAt: new Date(), resultPayload: { ok: true } as object },
        });
        return { ok: true };
      }
      default:
        return { ok: false, error: "Unsupported action type" };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    await prisma.aiAutopilotAction.update({
      where: { id: actionId },
      data: {
        status: AiAutopilotActionStatus.FAILED,
        resultPayload: { error: msg } as object,
        executedAt: new Date(),
      },
    });
    return { ok: false, error: msg };
  }
}
