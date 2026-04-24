import { prisma } from "@/lib/db";
import { TurboDraftInput, TurboDraftRole, TurboPropertyType, TurboParty } from "./types";
import { PlatformRole } from "@prisma/client";

export async function prefillTurboDraftFromListing(args: {
  listingId: string;
  userId?: string;
  role: TurboDraftRole;
  listingKind: "fsbo" | "crm" | "bnhub";
}): Promise<Partial<TurboDraftInput>> {
  const { listingId, listingKind, userId, role } = args;

  let property: any;
  let owner: any;

  if (listingKind === "bnhub") {
    property = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });
  } else if (listingKind === "fsbo") {
    property = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });
  } else {
    property = await prisma.crmListing.findUnique({
      where: { id: listingId },
      include: { broker: true },
    });
  }

  if (!property) return {};

  const parties: TurboParty[] = [];
  
  // Add Seller
  const seller = property.owner || property.broker;
  if (seller) {
    parties.push({
      id: seller.id,
      role: "SELLER",
      name: seller.name || "Propriétaire",
      email: seller.email,
      representedBy: listingKind === "crm" ? seller.name : undefined,
    });
  }

  // Detect property type
  let propertyType: TurboPropertyType = "RESIDENTIAL";
  const typeStr = (property.propertyType || "").toUpperCase();
  if (typeStr.includes("CONDO")) propertyType = "CONDO";
  else if (typeStr.includes("COMMERCIAL")) propertyType = "COMMERCIAL";
  else if (typeStr.includes("PLEX")) propertyType = "PLEX";
  else if (typeStr.includes("LAND")) propertyType = "LAND";

  const answers: Record<string, any> = {
    purchasePrice: property.priceCents || 0,
    inclusions: property.inclusions || "",
    exclusions: property.exclusions || "",
  };

  return {
    property: {
      address: property.address || "",
      city: property.city || "",
      cadastre: property.cadastreNumber || "",
      type: propertyType,
    },
    parties,
    answers,
    transactionType: "SALE",
    propertyType,
    representedStatus: listingKind === "crm" ? "PARTIAL" : "NOT_REPRESENTED",
  };
}

export async function detectUserTurboRole(userId?: string): Promise<{
  role: TurboDraftRole;
  representedStatus: "REPRESENTED" | "NOT_REPRESENTED";
}> {
  if (!userId) {
    return { role: "BUYER", representedStatus: "NOT_REPRESENTED" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, brokerVerifications: { where: { verificationStatus: "VERIFIED" }, take: 1 } },
  });

  if (user?.role === PlatformRole.BROKER || user?.role === PlatformRole.ADMIN) {
    return { role: "BROKER", representedStatus: "REPRESENTED" };
  }

  // Check if buyer has an assigned broker
  const lead = await prisma.lead.findFirst({
    where: { userId },
    select: { assignedBrokerId: true },
  });

  return {
    role: "BUYER",
    representedStatus: lead?.assignedBrokerId ? "REPRESENTED" : "NOT_REPRESENTED",
  };
}
