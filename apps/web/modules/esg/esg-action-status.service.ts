import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { EsgActionStatus } from "./esg-action.types";

const TAG = "[esg-action-status]";

export async function updateEsgActionStatus(input: {
  actionId: string;
  actorUserId: string;
  status: EsgActionStatus;
  note?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const noteTrim = typeof input.note === "string" ? input.note.trim() : "";

  if (input.status === "DISMISSED" && !noteTrim) {
    return { ok: false, error: "Dismiss requires a brief reason note." };
  }

  const row = await prisma.esgAction.findUnique({
    where: { id: input.actionId },
    select: { id: true, listingId: true, status: true },
  });
  if (!row) return { ok: false, error: "Action not found" };

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.esgAction.update({
      where: { id: input.actionId },
      data: {
        status: input.status,
        ...(input.status === "COMPLETED" ? { completedAt: now } : {}),
        ...(input.status === "OPEN" || input.status === "IN_PROGRESS" || input.status === "BLOCKED" ?
          { completedAt: null }
        : {}),
      },
    });

    await tx.esgActionActivity.create({
      data: {
        actionId: input.actionId,
        actorUserId: input.actorUserId,
        eventType:
          input.status === "COMPLETED" ? "COMPLETED"
          : input.status === "DISMISSED" ? "DISMISSED"
          : "STATUS_CHANGED",
        note: noteTrim ? noteTrim.slice(0, 4000) : null,
        metadataJson: { from: row.status, to: input.status },
      },
    });
  });

  logInfo(`${TAG} updated`, { actionId: input.actionId, status: input.status });
  return { ok: true };
}
