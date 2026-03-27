import { prisma } from "@/lib/db";
import { resolveAddonSelections, type SelectedAddonInput } from "@/lib/bnhub/hospitality-addons";
import { validateServiceForListing } from "./serviceTrustSafetyService";

export async function listReservationServices(bookingId: string) {
  return prisma.bnhubBookingService.findMany({
    where: { bookingId },
    include: { service: true, listingService: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function validateServiceSelection(args: {
  listingId: string;
  serviceId: string;
  listingServiceId: string;
}) {
  const offer = await prisma.bnhubListingService.findFirst({
    where: { id: args.listingServiceId, listingId: args.listingId, serviceId: args.serviceId },
    include: { service: true },
  });
  if (!offer) return { ok: false as const, error: "Invalid selection" };
  const gate = await validateServiceForListing({ listingId: args.listingId, serviceId: args.serviceId });
  if (!gate.allowed) return { ok: false as const, error: gate.reason };
  return { ok: true as const, offer };
}

export async function computeReservationServicesTotal(args: {
  listingId: string;
  nights: number;
  guestCount: number;
  selections: SelectedAddonInput[];
}) {
  return resolveAddonSelections({
    listingId: args.listingId,
    nights: args.nights,
    guestCount: args.guestCount,
    selections: args.selections,
  });
}

export async function confirmReservationServices(bookingId: string, hostUserId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true },
  });
  if (booking.listing.ownerId !== hostUserId) throw new Error("Forbidden");
  await prisma.bnhubBookingService.updateMany({
    where: { bookingId, status: "PENDING_APPROVAL" },
    data: { status: "CONFIRMED" },
  });
}

export async function cancelReservationService(lineId: string, guestUserId: string) {
  const line = await prisma.bnhubBookingService.findUniqueOrThrow({ where: { id: lineId } });
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: line.bookingId } });
  if (booking.guestId !== guestUserId) throw new Error("Forbidden");
  return prisma.bnhubBookingService.update({
    where: { id: lineId },
    data: { status: "CANCELLED" },
  });
}

export async function addServiceToReservation(_args: {
  bookingId: string;
  listingServiceId: string;
  quantity: number;
}): Promise<never> {
  throw new Error("Use checkout or dedicated post-booking purchase flow (v2)");
}

export async function removeServiceFromReservation(_lineId: string): Promise<never> {
  throw new Error("Use cancelReservationService");
}
