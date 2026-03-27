import type { PlatformRole } from "@prisma/client";
import type { Offer } from "@prisma/client";
import type { OfferActorRole } from "@/modules/offers/services/offer-status-machine";

export function isBrokerLikeRole(role: PlatformRole): boolean {
  return role === "BROKER" || role === "ADMIN";
}

export function resolveOfferActorRole(params: {
  userId: string;
  role: PlatformRole;
  offer: Pick<Offer, "buyerId" | "brokerId">;
}): OfferActorRole | null {
  const { userId, role, offer } = params;
  if (role === "ADMIN") return "admin";
  if (offer.buyerId === userId) return "buyer";
  if (isBrokerLikeRole(role)) return "broker";
  return null;
}

/** Buyer owns the offer; broker/admin can review when not draft-only buyer view. */
export function canViewOffer(params: {
  userId: string;
  role: PlatformRole;
  offer: Pick<Offer, "buyerId" | "brokerId" | "status">;
}): boolean {
  const { userId, role, offer } = params;
  if (offer.buyerId === userId) return true;
  if (role === "ADMIN") return true;
  if (!isBrokerLikeRole(role)) return false;
  if (offer.status === "DRAFT") return false;
  if (offer.brokerId == null || offer.brokerId === userId) return true;
  return false;
}
