import { prisma } from "@/lib/db";

export type CoOwnershipAdvisoryType =
  | "INSURANCE_GAP"
  | "CERTIFICATE_MISSING"
  | "EXPIRY_WARNING"
  | "VERIFICATION_REQUIRED";

export async function logCoOwnershipAdvisory(params: {
  listingId: string;
  brokerId: string;
  advisoryType: CoOwnershipAdvisoryType;
}) {
  return await prisma.coOwnershipAdvisoryLog.create({
    data: {
      listingId: params.listingId,
      brokerId: params.brokerId,
      advisoryType: params.advisoryType,
      advisoryDelivered: true,
      timestamp: new Date(),
    },
  });
}

export async function getListingAdvisories(listingId: string) {
  return await prisma.coOwnershipAdvisoryLog.findMany({
    where: { listingId },
    orderBy: { timestamp: "desc" },
  });
}
