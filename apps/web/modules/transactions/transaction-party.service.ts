import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { AddPartyInput } from "./transaction.types";
import { SD_PARTY_ROLES } from "./transaction-policy";
import { logTimelineEvent } from "./transaction-timeline.service";

const TAG = "[transaction.party.add]";

export async function addParty(input: AddPartyInput) {
  if (!SD_PARTY_ROLES.includes(input.role as (typeof SD_PARTY_ROLES)[number])) {
    throw new Error("Invalid party role");
  }

  const party = await prisma.lecipmSdTransactionParty.create({
    data: {
      transactionId: input.transactionId,
      role: input.role,
      displayName: input.displayName.trim().slice(0, 256),
      email: input.email?.trim().slice(0, 320) || null,
      phone: input.phone?.trim().slice(0, 64) || null,
    },
  });

  await logTimelineEvent(prisma, input.transactionId, "PARTY_ADDED", `Party added: ${input.role} — ${input.displayName}`);
  logInfo(`${TAG}`, { transactionId: input.transactionId, role: input.role });

  return party;
}

export async function listParties(transactionId: string) {
  return prisma.lecipmSdTransactionParty.findMany({
    where: { transactionId },
    orderBy: { createdAt: "asc" },
  });
}
