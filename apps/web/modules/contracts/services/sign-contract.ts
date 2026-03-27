/**
 * Universal e-sign for lease, broker agreements, and offer-linked contracts.
 */
import { prisma } from "@/lib/db";
import { CONTRACT_TYPES, E_SIGN_CONTRACT_TYPES, LEASE_CONTRACT_STATUS } from "@/lib/hubs/contract-types";
import {
  canAccessContract,
  getContractForAccess,
  resolveListingOwnerId,
  resolveSignerSignature,
} from "@/modules/contracts/services/access";
import { sendContractCompletedEmail } from "@/lib/email/contract-emails";
import { completeOpenActionQueueBySource } from "@/modules/notifications/services/action-queue";
import { onContractSigned } from "@/modules/notifications/services/workflow-notification-triggers";

export type SignContractInput = {
  contractId: string;
  userId: string;
  userEmail: string | null;
  typedName: string;
  signatureData?: string | null;
  ipAddress: string | null;
};

function isCancelled(status: string): boolean {
  return status.toLowerCase() === "cancelled" || status === LEASE_CONTRACT_STATUS.CANCELLED;
}

export async function signContractUniversal(
  input: SignContractInput
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const c = await getContractForAccess(input.contractId);
  if (!c) return { ok: false, error: "Contract not found" };
  if (!E_SIGN_CONTRACT_TYPES.has(c.type)) {
    return { ok: false, error: "This contract type does not support e-sign here" };
  }
  if (isCancelled(c.status)) return { ok: false, error: "Contract cancelled" };

  const dbUser = await prisma.user.findUnique({ where: { id: input.userId }, select: { role: true, email: true } });
  const listingOwnerId = await resolveListingOwnerId(c);
  if (!canAccessContract(input.userId, dbUser?.role ?? null, c, listingOwnerId)) {
    return { ok: false, error: "Forbidden" };
  }

  const sig = resolveSignerSignature(c, input.userId, input.userEmail ?? dbUser?.email);
  if (!sig) return { ok: false, error: "No pending signature for this account" };

  const name = input.typedName.trim();
  if (name.length < 2) return { ok: false, error: "Please type your full legal name" };

  await prisma.contractSignature.update({
    where: { id: sig.id },
    data: {
      signedAt: new Date(),
      ipAddress: input.ipAddress,
      signatureData: input.signatureData ?? null,
      name,
    },
  });

  const fresh = (await getContractForAccess(input.contractId))!;
  const allSigned = fresh.signatures.every((s) => s.signedAt);
  let newStatus = fresh.status;

  if (allSigned) {
    newStatus = c.type === CONTRACT_TYPES.LEASE ? LEASE_CONTRACT_STATUS.COMPLETED : "completed";
    await prisma.contract.update({
      where: { id: input.contractId },
      data: {
        status: newStatus,
        signedAt: new Date(),
      },
    });

    const od = await prisma.offerDocument.findFirst({ where: { contractId: input.contractId } });
    if (od) {
      await prisma.offerDocument.update({
        where: { id: od.id },
        data: { status: "signed" },
      });
    }

    const parties = fresh.signatures.map((s) => s.email);
    await sendContractCompletedEmail({
      to: [...new Set(parties)],
      contractId: input.contractId,
      title: fresh.title || "Agreement",
    });
  } else {
    const anySigned = fresh.signatures.some((s) => s.signedAt);
    if (anySigned) {
      newStatus = c.type === CONTRACT_TYPES.LEASE ? LEASE_CONTRACT_STATUS.SIGNED : "signed";
      await prisma.contract.update({
        where: { id: input.contractId },
        data: { status: newStatus },
      });
    }
  }

  await completeOpenActionQueueBySource(
    input.userId,
    { sourceType: "contract", sourceId: input.contractId, types: ["SIGN_CONTRACT"] },
    input.userId
  );

  if (allSigned) {
    const notifyIds = new Set<string>();
    for (const s of fresh.signatures) {
      if (s.userId) notifyIds.add(s.userId);
    }
    if (fresh.createdById) notifyIds.add(fresh.createdById);
    void onContractSigned({
      contractId: input.contractId,
      notifyUserIds: [...notifyIds],
    });
  }

  return { ok: true, status: newStatus };
}
