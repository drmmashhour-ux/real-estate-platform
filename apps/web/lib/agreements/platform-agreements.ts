/**
 * Contract logic – store and retrieve all platform agreements in DB.
 * Host agreement: required before listing; saved when host accepts.
 * Booking agreement: auto-generated when booking is created; saved to DB.
 */

import { prisma } from "@/lib/db";

export const AGREEMENT_TYPES = {
  HOST_AGREEMENT: "host_agreement",
  BOOKING_AGREEMENT: "booking_agreement",
} as const;

export const RELATED_ENTITY_TYPES = {
  BNHUB_HOST: "bnhub_host",
  BOOKING: "booking",
} as const;

/** Save host agreement to DB when host accepts. Call after acceptHostAgreement. */
export async function saveHostAgreement(params: {
  hostId: string;
  version: string;
  contentHtml: string;
  acceptedAt?: Date;
}): Promise<string> {
  const agreement = await prisma.platformAgreement.create({
    data: {
      agreementType: AGREEMENT_TYPES.HOST_AGREEMENT,
      version: params.version,
      contentHtml: params.contentHtml,
      relatedEntityType: RELATED_ENTITY_TYPES.BNHUB_HOST,
      relatedEntityId: params.hostId,
      acceptedAt: params.acceptedAt ?? new Date(),
    },
  });
  return agreement.id;
}

/** Save booking agreement to DB. Call when booking is created (auto-generated). */
export async function saveBookingAgreement(params: {
  bookingId: string;
  version: string;
  contentHtml: string;
  metadata?: { guestId: string; hostId: string; listingId: string };
  acceptedAt?: Date;
}): Promise<string> {
  const agreement = await prisma.platformAgreement.create({
    data: {
      agreementType: AGREEMENT_TYPES.BOOKING_AGREEMENT,
      version: params.version,
      contentHtml: params.contentHtml,
      relatedEntityType: RELATED_ENTITY_TYPES.BOOKING,
      relatedEntityId: params.bookingId,
      metadata: params.metadata ?? undefined,
      acceptedAt: params.acceptedAt ?? new Date(),
    },
  });
  return agreement.id;
}

/** Get the latest host agreement record for a host. */
export async function getHostAgreementRecord(hostId: string) {
  return prisma.platformAgreement.findFirst({
    where: {
      agreementType: AGREEMENT_TYPES.HOST_AGREEMENT,
      relatedEntityType: RELATED_ENTITY_TYPES.BNHUB_HOST,
      relatedEntityId: hostId,
    },
    orderBy: { acceptedAt: "desc" },
  });
}

/** Get the booking agreement for a booking (if any). */
export async function getBookingAgreementRecord(bookingId: string) {
  return prisma.platformAgreement.findFirst({
    where: {
      agreementType: AGREEMENT_TYPES.BOOKING_AGREEMENT,
      relatedEntityType: RELATED_ENTITY_TYPES.BOOKING,
      relatedEntityId: bookingId,
    },
    orderBy: { acceptedAt: "desc" },
  });
}

/** List all agreements (e.g. for admin). */
export async function listAgreements(params: {
  agreementType?: string;
  relatedEntityId?: string;
  limit?: number;
}) {
  const where: { agreementType?: string; relatedEntityType?: string; relatedEntityId?: string } = {};
  if (params.agreementType) where.agreementType = params.agreementType;
  if (params.relatedEntityId) where.relatedEntityId = params.relatedEntityId;

  return prisma.platformAgreement.findMany({
    where,
    orderBy: { acceptedAt: "desc" },
    take: Math.min(params.limit ?? 100, 500),
  });
}
