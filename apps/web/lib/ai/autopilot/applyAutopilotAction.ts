import "server-only";

import { AiAutopilotActionStatus, AiAutopilotActionType } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Applies an owner-approved autopilot row to listing state (best-effort). */
export async function applyAutopilotAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const action = await prisma.aiAutopilotAction.findUnique({ where: { id } });
  if (!action || action.status !== AiAutopilotActionStatus.APPROVED) {
    return { ok: false, error: "not_found_or_not_approved" };
  }

  const listingId = action.listingId;
  const input =
    action.inputPayload && typeof action.inputPayload === "object" && action.inputPayload !== null && !Array.isArray(action.inputPayload)
      ? (action.inputPayload as Record<string, unknown>)
      : {};

  try {
    if (listingId) {
      const data: { nightPriceCents?: number; description?: string; title?: string } = {};
      if (action.actionType === AiAutopilotActionType.UPDATE_PRICE) {
        const cents =
          typeof input.nightPriceCents === "number"
            ? input.nightPriceCents
            : typeof input.recommendedPriceCents === "number"
              ? input.recommendedPriceCents
              : undefined;
        if (cents != null) data.nightPriceCents = Math.round(cents);
      } else if (action.actionType === AiAutopilotActionType.OPTIMIZE_DESCRIPTION && typeof input.description === "string" && input.description.trim()) {
        data.description = input.description;
      } else if (action.actionType === AiAutopilotActionType.OPTIMIZE_TITLE && typeof input.title === "string" && input.title.trim()) {
        data.title = input.title;
      }
      if (Object.keys(data).length > 0) {
        await prisma.shortTermListing.update({ where: { id: listingId }, data });
      }
    }

    await prisma.aiAutopilotAction.update({
      where: { id },
      data: {
        status: AiAutopilotActionStatus.EXECUTED,
        executedAt: new Date(),
        resultPayload: { ok: true, appliedAt: new Date().toISOString() },
      },
    });
    return { ok: true };
  } catch (e) {
    await prisma.aiAutopilotAction.update({
      where: { id },
      data: {
        status: AiAutopilotActionStatus.FAILED,
        resultPayload: {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        },
      },
    });
    return { ok: false, error: "apply_failed" };
  }
}
