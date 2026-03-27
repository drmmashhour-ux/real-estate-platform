import { prisma } from "@/lib/db";
import { computeAddonLineCents } from "@/lib/bnhub/hospitality-addons";
import { logHospitalityAction } from "./hospitalityAuditService";
import { getActiveMembershipDiscountBps, getUserMembership } from "./membershipService";

export async function listBundles(args?: { activeOnly?: boolean }) {
  return prisma.bnhubServiceBundle.findMany({
    where: args?.activeOnly === false ? {} : { isActive: true },
    include: { items: { include: { service: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getBundleByCode(bundleCode: string) {
  return prisma.bnhubServiceBundle.findUnique({
    where: { bundleCode },
    include: { items: { include: { service: true } } },
  });
}

/** Sum bundle in cents from item overrides or catalog listing prices when attached to listing. */
export async function computeBundlePrice(args: {
  bundleId: string;
  listingId: string;
  nights: number;
  guestCount: number;
  userId?: string | null;
}): Promise<{ totalCents: number; lines: { serviceCode: string; totalCents: number }[] }> {
  const bundle = await prisma.bnhubServiceBundle.findUnique({
    where: { id: args.bundleId },
    include: { items: { include: { service: true } } },
  });
  if (!bundle || !bundle.isActive) throw new Error("Bundle not available");

  const discountBps = args.userId ? await getActiveMembershipDiscountBps(args.userId) : 0;

  const lines: { serviceCode: string; totalCents: number }[] = [];
  let totalCents = bundle.basePriceCents ?? 0;

  for (const item of bundle.items) {
    const offer = await prisma.bnhubListingService.findFirst({
      where: { listingId: args.listingId, serviceId: item.serviceId, isEnabled: true, moderationStatus: "APPROVED" },
    });
    const priceCents = item.pricingOverrideCents ?? offer?.priceCents ?? 0;
    const pricingType = offer?.pricingType ?? "FIXED";
    const { totalPriceCents } = computeAddonLineCents(
      pricingType,
      priceCents,
      args.nights,
      args.guestCount,
      item.defaultQuantity,
      offer?.isIncluded ?? false
    );
    lines.push({ serviceCode: item.service.serviceCode, totalCents: totalPriceCents });
    totalCents += totalPriceCents;
  }

  if (discountBps > 0) {
    totalCents -= Math.round((totalCents * discountBps) / 10000);
  }
  return { totalCents: Math.max(0, totalCents), lines };
}

export async function applyBundleToReservation(args: {
  bookingId: string;
  bundleId: string;
  guestUserId: string;
  listingId: string;
  totalPriceCents: number;
  actorId?: string;
}) {
  const row = await prisma.bnhubBookingBundle.create({
    data: {
      bookingId: args.bookingId,
      bundleId: args.bundleId,
      guestUserId: args.guestUserId,
      listingId: args.listingId,
      totalPriceCents: args.totalPriceCents,
      bundleStatus: "SELECTED",
    },
  });
  await logHospitalityAction({
    actorType: args.actorId ? "GUEST" : "SYSTEM",
    actorId: args.actorId ?? null,
    entityType: "BnhubBookingBundle",
    entityId: row.id,
    actionType: "apply_bundle",
    actionSummary: `Bundle ${args.bundleId} on booking ${args.bookingId}`,
  });
  return row;
}

export async function removeBundleFromReservation(bookingBundleId: string, actorId: string) {
  const row = await prisma.bnhubBookingBundle.update({
    where: { id: bookingBundleId },
    data: { bundleStatus: "CANCELLED" },
  });
  await logHospitalityAction({
    actorType: "GUEST",
    actorId,
    entityType: "BnhubBookingBundle",
    entityId: bookingBundleId,
    actionType: "remove_bundle",
    actionSummary: "Bundle cancelled",
  });
  return row;
}

export async function getEligibleBundlesForListingOrReservation(args: {
  listingId: string;
  userId?: string | null;
}) {
  const bundles = await listBundles({ activeOnly: true });
  const member =
    args.userId != null && args.userId !== ""
      ? await getUserMembership(args.userId)
      : null;
  const out = [];
  for (const b of bundles) {
    if (b.visibilityScope === "ADMIN_SELECTED") continue;
    if (b.visibilityScope === "HOST_SELECTED") continue;
    if (b.visibilityScope === "MEMBERS_ONLY" && !member) continue;
    out.push(b);
  }
  return out;
}

/** Active bundles with PUBLIC visibility only (no listing / membership context). */
export async function listPublicBundlesCatalog() {
  const bundles = await listBundles({ activeOnly: true });
  return bundles.filter((b) => b.visibilityScope === "PUBLIC");
}
