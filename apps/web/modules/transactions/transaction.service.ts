import type { PlatformRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { logTransactionTagged } from "@/lib/server/launch-logger";
import { assertBrokerLaunchBilling } from "@/modules/billing/lecipm-launch-gates";
import { recordBrokerUsageEvent, usageAmountForType } from "@/modules/billing/lecipm-launch-usage";
import { allocateNextYearlySequence, buildNewTransactionNumber } from "./transaction-number.service";
import { logTimelineEvent } from "./transaction-timeline.service";
import type { CreateTransactionInput } from "./transaction.types";
import { isBrokerOrAdmin } from "./transaction-policy";
import { PrivacyLaunchGuard } from "@/modules/privacy/utils/launch-guards";

const TAG_CREATE = "[transaction.create]";

async function assertListingForBroker(listingId: string, brokerId: string, role: PlatformRole): Promise<void> {
  if (role === "ADMIN") {
    const row = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
    if (!row) throw new Error("Listing not found");
    return;
  }
  const row = await prisma.listing.findFirst({
    where: {
      id: listingId,
      OR: [{ ownerId: brokerId }, { brokerAccesses: { some: { brokerId } } }],
    },
    select: { id: true },
  });
  if (!row) throw new Error("Listing not accessible");
}

async function assertPropertyForBroker(propertyId: string, brokerId: string, role: PlatformRole): Promise<void> {
  if (role === "ADMIN") {
    const row = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
    if (!row) throw new Error("Property not found");
    return;
  }
  const row = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: brokerId },
    select: { id: true },
  });
  if (!row) throw new Error("Property not accessible");
}

export async function createTransaction(input: CreateTransactionInput, actorRole: PlatformRole) {
  if (!isBrokerOrAdmin(actorRole)) {
    throw new Error("Forbidden");
  }

  // 1. Mandatory Privacy & Consent Gate
  // In a real-world scenario, we check if the primary client (input.clientId) has signed the acknowledgment.
  // For this demo/impl, if brokerId is provided and it's a new transaction, we assume a gate must be passed.
  // Note: if the transaction doesn't exist yet, we check for a global userId-based consent record.
  if (input.brokerId && actorRole !== "ADMIN") {
    await PrivacyLaunchGuard.assertTransactionGate(input.brokerId);
  }

  await assertBrokerLaunchBilling({
    brokerUserId: input.brokerId,
    actorRole,
    action: "TRANSACTION",
  });

  if (input.listingId) {
    await assertListingForBroker(input.listingId, input.brokerId, actorRole);
  }
  if (input.propertyId) {
    await assertPropertyForBroker(input.propertyId, input.brokerId, actorRole);
  }

  const year = new Date().getFullYear();

  const row = await prisma.$transaction(async (tx) => {
    const seq = await allocateNextYearlySequence(tx, year);
    const transactionNumber = buildNewTransactionNumber(year, seq);

    const created = await tx.lecipmSdTransaction.create({
      data: {
        transactionNumber,
        brokerId: input.brokerId,
        transactionType: input.transactionType.trim().slice(0, 32),
        title: input.title?.trim().slice(0, 512) ?? null,
        status: (input.status ?? "DRAFT").slice(0, 24),
        listingId: input.listingId ?? null,
        propertyId: input.propertyId ?? null,
      },
    });

    await logTimelineEvent(tx, created.id, "CREATED", "Transaction created");

    logTransactionTagged.info("lecipm_sd_transaction created", {
      transactionId: created.id,
      transactionNumber: created.transactionNumber,
      brokerId: input.brokerId,
    });
    logInfo(`${TAG_CREATE}`, {
      id: created.id,
      transactionNumber: created.transactionNumber,
      brokerId: input.brokerId,
    });

    return created;
  });

  await recordBrokerUsageEvent({
    userId: input.brokerId,
    type: "TRANSACTION",
    amount: usageAmountForType("TRANSACTION"),
    metaJson: { transactionId: row.id, transactionNumber: row.transactionNumber },
  });

  return row;
}

export async function getTransactionById(id: string) {
  return prisma.lecipmSdTransaction.findUnique({
    where: { id },
    include: {
      broker: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, listingCode: true } },
      property: { select: { id: true, address: true, city: true } },
    },
  });
}

export type ListTransactionsFilters = {
  brokerId: string;
  role: PlatformRole;
  status?: string | null;
  brokerFilterId?: string | null;
};

export async function listTransactions(filters: ListTransactionsFilters) {
  const where: Prisma.LecipmSdTransactionWhereInput = {};

  if (filters.role === "ADMIN") {
    if (filters.brokerFilterId) {
      where.brokerId = filters.brokerFilterId;
    }
  } else {
    where.brokerId = filters.brokerId;
  }

  if (filters.status?.trim()) {
    where.status = filters.status.trim();
  }

  return prisma.lecipmSdTransaction.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      listing: { select: { id: true, title: true, listingCode: true } },
    },
  });
}
