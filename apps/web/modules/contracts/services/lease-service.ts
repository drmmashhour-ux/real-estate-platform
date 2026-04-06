import type { Prisma } from "@prisma/client";

type BookingWithGuestListing = Prisma.BookingGetPayload<{
  include: {
    guest: { select: { id: true; name: true; email: true } };
    listing: true;
  };
}>;
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { prisma } from "@/lib/db";
import { CONTRACT_TYPES, LEASE_CONTRACT_STATUS } from "@/lib/hubs/contract-types";
import { buildLeaseTemplateHtml } from "@/modules/contracts/services/templates/lease-template";
import type { LeaseContentV1 } from "@/modules/contracts/services/lease-types";
import { getContractForAccess } from "@/modules/contracts/services/access";
import { sendContractSignRequestEmail } from "@/lib/email/contract-emails";
import { signContractUniversal } from "@/modules/contracts/services/sign-contract";
import { onContractReadyForSignature } from "@/modules/notifications/services/workflow-notification-triggers";

const LEGAL_NOTICE =
  "This electronic signature is legally binding under applicable Québec laws (including provisions on electronic documents and signatures where applicable).";

export type CreateLeaseInput = {
  actorId: string;
  actorRole: string;
  listingId: string;
  bookingId?: string | null;
  /** Required when no booking (manual lease). */
  tenant?: { name: string; email: string };
  landlord?: { name: string; email: string };
  broker?: { name: string; email: string } | null;
  paymentMethod?: string;
};

function money(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(cents / 100);
}

export async function createLeaseContract(input: CreateLeaseInput): Promise<{ contractId: string }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: input.listingId },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
  if (!listing) throw new Error("Listing not found");

  let booking: BookingWithGuestListing | null = null;

  if (!input.bookingId && (!input.tenant?.email?.trim() || !input.landlord?.email?.trim())) {
    throw new Error("Tenant and landlord name/email are required when no booking is linked");
  }

  if (input.bookingId) {
    const b = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { guest: { select: { id: true, name: true, email: true } }, listing: true },
    });
    if (!b) throw new Error("Booking not found");
    if (b.listingId !== input.listingId) throw new Error("Booking does not match listing");
    const okStatus = ["CONFIRMED", "COMPLETED"];
    if (!okStatus.includes(b.status)) {
      throw new Error("Lease can only be generated once the booking is confirmed or completed");
    }
    booking = b;

    const isAdmin0 = input.actorRole === "ADMIN";
    const isHost0 = listing.ownerId === input.actorId;
    const isGuest0 = booking.guestId === input.actorId;
    if (!isAdmin0 && !isHost0 && !isGuest0) {
      throw new Error("Not authorized to create this lease");
    }

    const dup = await prisma.contract.findFirst({
      where: {
        bookingId: input.bookingId,
        type: CONTRACT_TYPES.LEASE,
        NOT: { status: LEASE_CONTRACT_STATUS.CANCELLED },
      },
      select: { id: true },
    });
    if (dup) {
      return { contractId: dup.id };
    }
  } else {
    const isAdmin = input.actorRole === "ADMIN";
    const isHost = listing.ownerId === input.actorId;
    if (!isAdmin && !isHost) {
      throw new Error("Not authorized to create this lease without a booking");
    }
  }

  const landlordName =
    input.landlord?.name?.trim() ||
    listing.owner.name?.trim() ||
    "Landlord";
  const landlordEmail = (input.landlord?.email?.trim() || listing.owner.email).trim();

  const tenantName =
    input.tenant?.name?.trim() ||
    booking?.guest.name?.trim() ||
    "Tenant";
  const tenantEmail = (input.tenant?.email?.trim() || booking?.guest.email || "").trim();
  if (!tenantEmail) throw new Error("Tenant email is required");

  const leaseStart = booking
    ? booking.checkIn.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const leaseEnd = booking
    ? booking.checkOut.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const totalCents = booking
    ? booking.totalCents + booking.guestFeeCents
    : listing.nightPriceCents * 7;
  const nights = booking?.nights && booking.nights > 0 ? booking.nights : 7;
  const rentCadence = booking ? `Total for ${nights} night(s)` : "Per platform listing";
  const rentAmountDisplay = booking ? `${money(totalCents)} (${rentCadence})` : `${money(listing.nightPriceCents)} per night (example)`;

  const depositCents = listing.securityDepositCents ?? 0;
  const securityDepositDisplay = depositCents > 0 ? money(depositCents) : "None specified";

  const paymentMethod =
    input.paymentMethod?.trim() || "Stripe / card on file through LECIPM (where applicable)";

  const contractReference = `LEC-LEASE-${Date.now().toString(36).toUpperCase()}`;
  const generatedAtIso = new Date().toISOString();

  const broker =
    input.broker && input.broker.name.trim()
      ? { name: input.broker.name.trim(), email: input.broker.email.trim() }
      : listing.brokerLicenseNumber || listing.brokerageName
        ? {
            name: listing.brokerageName?.trim() || "Licensed broker",
            email: landlordEmail,
          }
        : null;

  const snapshot: LeaseContentV1 = {
    kind: "lease_v1",
    propertyAddress: listing.address,
    city: listing.city,
    region: listing.region,
    province: listing.province ?? "QC",
    country: listing.country,
    listingTitle: listing.title,
    listingCode: listing.listingCode,
    leaseStart,
    leaseEnd,
    rentAmountDisplay,
    rentCadence,
    paymentMethod,
    securityDepositDisplay,
    tenant: { name: tenantName, email: tenantEmail },
    landlord: { name: landlordName, email: landlordEmail },
    broker,
    legalNotice: LEGAL_NOTICE,
  };

  const contentHtml = buildLeaseTemplateHtml({
    propertyAddress: listing.address,
    city: listing.city,
    region: listing.region,
    province: listing.province ?? "QC",
    country: listing.country,
    listingTitle: listing.title,
    listingCode: listing.listingCode,
    leaseStart,
    leaseEnd,
    rentAmountDisplay,
    rentCadence,
    paymentMethod,
    securityDepositDisplay,
    landlord: { name: landlordName, email: landlordEmail },
    tenant: { name: tenantName, email: tenantEmail },
    broker,
    generatedAtIso,
    contractReference,
  });

  const title = `Residential lease — ${listing.title.slice(0, 80)}`;

  let brokerUserId: string | null = null;
  if (broker) {
    const bu = await prisma.user.findUnique({
      where: { email: broker.email },
      select: { id: true },
    });
    brokerUserId = bu?.id ?? null;
  }

  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: {
        type: CONTRACT_TYPES.LEASE,
        // Primary CRM row: tenant (guest). Manual lease without booking: creator as tenant placeholder.
        userId: booking?.guestId ?? input.actorId,
        createdById: input.actorId,
        listingId: listing.id,
        bookingId: booking?.id ?? null,
        title,
        contentHtml,
        content: snapshot as unknown as Prisma.InputJsonValue,
        status: LEASE_CONTRACT_STATUS.SENT,
        hub: "bnhub",
      },
    });

    const sigRows: { name: string; email: string; role: string; userId: string | null }[] = [
      { name: tenantName, email: tenantEmail, role: "tenant", userId: booking?.guestId ?? null },
      { name: landlordName, email: landlordEmail, role: "landlord", userId: listing.ownerId },
    ];
    if (broker) {
      sigRows.push({
        name: broker.name,
        email: broker.email,
        role: "broker",
        userId: null,
      });
    }

    await tx.contractSignature.createMany({
      data: sigRows.map((s) => ({
        contractId: c.id,
        name: s.name,
        email: s.email,
        role: s.role,
        userId: s.userId,
      })),
    });

    return c;
  });

  const appUrl = getPublicAppUrl();
  const signUrl = `${appUrl}/contracts/${contract.id}`;

  const notifyEmails = [tenantEmail, landlordEmail, ...(broker ? [broker.email] : [])].filter(
    (e, i, a) => a.indexOf(e) === i
  );

  await sendContractSignRequestEmail({
    to: notifyEmails,
    signUrl,
    title,
    reference: contractReference,
  });

  const notifySignerIds = new Set<string>();
  if (booking?.guestId) notifySignerIds.add(booking.guestId);
  notifySignerIds.add(listing.ownerId);
  if (brokerUserId) notifySignerIds.add(brokerUserId);
  for (const uid of notifySignerIds) {
    void onContractReadyForSignature({
      contractId: contract.id,
      signerUserId: uid,
      title,
    });
  }

  return { contractId: contract.id };
}

export type SignLeaseInput = {
  contractId: string;
  userId: string;
  userEmail: string | null;
  typedName: string;
  signatureData?: string | null;
  ipAddress: string | null;
};

export async function signLeaseContract(input: SignLeaseInput): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const c = await getContractForAccess(input.contractId);
  if (!c) return { ok: false, error: "Contract not found" };
  if (c.type !== CONTRACT_TYPES.LEASE) return { ok: false, error: "Not a lease contract" };
  return signContractUniversal(input);
}

export { contractToPdfPayload as leaseContractToPdfPayload } from "@/modules/contracts/services/pdf-payload";
