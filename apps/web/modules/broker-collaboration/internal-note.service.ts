import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { assertDealAccessForBroker } from "./visibility.service";
import type { CreateInternalNoteInput } from "./collaboration.types";

export async function createInternalNote(
  actorId: string,
  role: PlatformRole,
  input: CreateInternalNoteInput,
): Promise<{ id: string } | { error: string }> {
  if (input.dealId) {
    const ok = await assertDealAccessForBroker(actorId, input.dealId, role);
    if (!ok) return { error: "Deal access denied" };
  }
  if (input.listingId) {
    const access = await prisma.brokerListingAccess.findFirst({
      where: { listingId: input.listingId, brokerId: actorId },
    });
    if (!access && role !== PlatformRole.ADMIN) return { error: "Listing access denied" };
  }
  if (input.lecipmContactId) {
    const c = await prisma.lecipmCrmContact.findFirst({
      where: { id: input.lecipmContactId, brokerId: actorId },
    });
    if (!c && role !== PlatformRole.ADMIN) return { error: "Contact access denied" };
  }

  const row = await prisma.brokerInternalNote.create({
    data: {
      createdById: actorId,
      dealId: input.dealId ?? undefined,
      listingId: input.listingId ?? undefined,
      lecipmContactId: input.lecipmContactId ?? undefined,
      visibilityScope: input.visibilityScope,
      noteType: input.noteType,
      body: input.body,
      metadata: (input.metadata ?? {}) as object,
    },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: actorId,
    actionKey: brokerWorkspaceAuditKeys.internalNoteCreated,
    dealId: input.dealId,
    payload: { noteId: row.id, visibilityScope: input.visibilityScope },
  });

  return { id: row.id };
}

export async function listInternalNotesForDeal(actorId: string, role: PlatformRole, dealId: string) {
  const ok = await assertDealAccessForBroker(actorId, dealId, role);
  if (!ok) return [];
  return prisma.brokerInternalNote.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      visibilityScope: true,
      noteType: true,
      body: true,
      createdAt: true,
      createdById: true,
    },
  });
}
