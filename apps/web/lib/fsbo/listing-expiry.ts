import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CONTRACT_TYPES } from "@/lib/hubs/contract-types";
import { createNotification } from "@/modules/notifications/services/create-notification";

const OWNER_DIRECT_EXPIRY_MONTHS = 3;
const RENEWAL_REMINDER_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const FSBO_ARCHIVED_STATUS = "ARCHIVED";

type BrokerExpiryContract = {
  type: string;
  status: string;
  signedAt: Date | null;
  createdAt: Date;
  content: Prisma.JsonValue | null;
};

type FsboExpiryListing = {
  id: string;
  ownerId: string;
  title: string;
  listingOwnerType: "SELLER" | "BROKER";
  status: string;
  moderationStatus: string;
  createdAt: Date;
  paidPublishAt: Date | null;
  expiresAt: Date | null;
  expiryReminderSentAt: Date | null;
  archivedAt: Date | null;
  contracts: BrokerExpiryContract[];
};

export type FsboExpirySnapshot = {
  expiresAt: Date | null;
  expired: boolean;
  archived: boolean;
  renewable: boolean;
  renewalReminderDue: boolean;
  source: "owner_direct" | "broker_contract" | "manual_override" | "unset";
};

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readContractSnapshot(contract: BrokerExpiryContract): Record<string, unknown> | null {
  if (!contract.content || typeof contract.content !== "object" || Array.isArray(contract.content)) {
    return null;
  }

  const content = contract.content as Record<string, unknown>;
  const snapshot =
    content.snapshot && typeof content.snapshot === "object" && !Array.isArray(content.snapshot)
      ? (content.snapshot as Record<string, unknown>)
      : null;

  return snapshot ?? content;
}

function resolveBrokerExpiry(contracts: BrokerExpiryContract[]): Date | null {
  const eligible = contracts
    .filter(
      (contract) =>
        contract.status === "signed" &&
        (contract.type === CONTRACT_TYPES.BROKER_AGREEMENT_SELLER ||
          contract.type === CONTRACT_TYPES.BROKER_AGREEMENT ||
          contract.type === "BROKER_AGREEMENT")
    )
    .sort((a, b) => (b.signedAt ?? b.createdAt).getTime() - (a.signedAt ?? a.createdAt).getTime());

  for (const contract of eligible) {
    const snapshot = readContractSnapshot(contract);
    const explicitEnd = parseDate(snapshot?.endDate);
    if (explicitEnd) return explicitEnd;

    const durationRaw = snapshot?.durationMonths;
    const durationMonths =
      typeof durationRaw === "number"
        ? Math.round(durationRaw)
        : typeof durationRaw === "string"
          ? Number.parseInt(durationRaw, 10)
          : NaN;

    if (Number.isFinite(durationMonths) && durationMonths > 0) {
      const startDate = parseDate(snapshot?.startDate) ?? contract.signedAt ?? contract.createdAt;
      return addMonths(startDate, durationMonths);
    }
  }

  return null;
}

function resolveOwnerDirectExpiry(listing: FsboExpiryListing): Date | null {
  const activationBase = listing.paidPublishAt ?? (listing.status === "ACTIVE" ? listing.createdAt : null);
  if (!activationBase) return listing.expiresAt;

  const defaultExpiry = addMonths(activationBase, OWNER_DIRECT_EXPIRY_MONTHS);
  if (listing.expiresAt && listing.expiresAt.getTime() > defaultExpiry.getTime()) {
    return listing.expiresAt;
  }
  return defaultExpiry;
}

export function buildFsboPublicVisibilityWhere(now: Date = new Date()): Prisma.FsboListingWhereInput {
  return {
    status: "ACTIVE",
    moderationStatus: "APPROVED",
    archivedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export function getFsboExpirySnapshot(listing: FsboExpiryListing, now: Date = new Date()): FsboExpirySnapshot {
  const brokerExpiry = listing.listingOwnerType === "BROKER" ? resolveBrokerExpiry(listing.contracts) : null;
  const expiresAt =
    listing.listingOwnerType === "BROKER"
      ? brokerExpiry ?? listing.expiresAt
      : resolveOwnerDirectExpiry(listing);

  const expired = Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
  const archived = listing.status === FSBO_ARCHIVED_STATUS || Boolean(listing.archivedAt);
  const renewalReminderDue =
    Boolean(expiresAt) &&
    !expired &&
    expiresAt!.getTime() - now.getTime() <= RENEWAL_REMINDER_WINDOW_MS &&
    listing.expiryReminderSentAt == null;

  return {
    expiresAt,
    expired,
    archived,
    renewable: listing.listingOwnerType === "SELLER" && listing.status !== "SOLD",
    renewalReminderDue,
    source: listing.listingOwnerType === "BROKER" ? (brokerExpiry ? "broker_contract" : "unset") : listing.expiresAt ? "manual_override" : "owner_direct",
  };
}

async function sendRenewalReminder(listing: FsboExpiryListing, snapshot: FsboExpirySnapshot): Promise<void> {
  if (!snapshot.expiresAt || !snapshot.renewalReminderDue) return;

  await createNotification({
    userId: listing.ownerId,
    type: "REMINDER",
    priority: "HIGH",
    listingId: listing.id,
    title: "AI reminder: your listing expires in less than 2 weeks",
    message:
      listing.listingOwnerType === "BROKER"
        ? `The listing "${listing.title}" is nearing expiry. Renew or extend the broker mandate to keep the listing active on Sell Hub.`
        : `The listing "${listing.title}" will expire soon. Renew it now to avoid automatic archive from Sell Hub.`,
    actionUrl: `/dashboard/seller/listings/${encodeURIComponent(listing.id)}`,
    actionLabel: listing.listingOwnerType === "BROKER" ? "Review mandate" : "Renew listing",
    metadata: {
      kind: "fsbo_expiry_reminder",
      expiresAt: snapshot.expiresAt.toISOString(),
      ownerType: listing.listingOwnerType,
    },
  });

  await prisma.fsboListing.update({
    where: { id: listing.id },
    data: { expiryReminderSentAt: new Date() },
  });
}

export async function syncFsboListingExpiryState(
  listingId: string,
  opts?: { sendReminder?: boolean }
): Promise<FsboExpirySnapshot | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      listingOwnerType: true,
      status: true,
      moderationStatus: true,
      createdAt: true,
      paidPublishAt: true,
      expiresAt: true,
      expiryReminderSentAt: true,
      archivedAt: true,
      contracts: {
        select: {
          type: true,
          status: true,
          signedAt: true,
          createdAt: true,
          content: true,
        },
      },
    },
  });

  if (!listing) return null;

  const now = new Date();
  const snapshot = getFsboExpirySnapshot(listing, now);
  const nextData: Prisma.FsboListingUpdateInput = {};

  if ((listing.expiresAt?.getTime() ?? null) !== (snapshot.expiresAt?.getTime() ?? null)) {
    nextData.expiresAt = snapshot.expiresAt;
  }

  if (snapshot.expired && listing.status !== "SOLD" && listing.status !== FSBO_ARCHIVED_STATUS) {
    nextData.status = FSBO_ARCHIVED_STATUS;
    nextData.archivedAt = listing.archivedAt ?? now;
  }

  if (Object.keys(nextData).length > 0) {
    await prisma.fsboListing.update({
      where: { id: listing.id },
      data: nextData,
    });
  }

  const finalSnapshot = {
    ...snapshot,
    archived: snapshot.archived || nextData.status === FSBO_ARCHIVED_STATUS,
  };

  if (opts?.sendReminder) {
    await sendRenewalReminder(listing, finalSnapshot);
  }

  return finalSnapshot;
}

export async function renewOwnerDirectFsboListing(listingId: string): Promise<FsboExpirySnapshot> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      listingOwnerType: true,
      status: true,
      moderationStatus: true,
      createdAt: true,
      paidPublishAt: true,
      expiresAt: true,
      expiryReminderSentAt: true,
      archivedAt: true,
      contracts: {
        select: {
          type: true,
          status: true,
          signedAt: true,
          createdAt: true,
          content: true,
        },
      },
    },
  });

  if (!listing) throw new Error("listing_not_found");
  if (listing.listingOwnerType !== "SELLER") throw new Error("broker_contract_controls_expiry");
  if (listing.status === "SOLD") throw new Error("listing_not_renewable");

  const snapshot = getFsboExpirySnapshot(listing);
  const base = snapshot.expiresAt && snapshot.expiresAt.getTime() > Date.now() ? snapshot.expiresAt : new Date();
  const expiresAt = addMonths(base, OWNER_DIRECT_EXPIRY_MONTHS);

  await prisma.fsboListing.update({
    where: { id: listing.id },
    data: {
      expiresAt,
      expiryReminderSentAt: null,
      archivedAt: null,
      status: listing.moderationStatus === "APPROVED" ? "ACTIVE" : listing.status,
    },
  });

  return {
    expiresAt,
    expired: false,
    archived: false,
    renewable: true,
    renewalReminderDue: false,
    source: "manual_override",
  };
}
