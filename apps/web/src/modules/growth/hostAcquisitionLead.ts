import { prisma } from "@/lib/db";
import { ListingAcquisitionSourceType, ListingAcquisitionPermissionStatus, ListingAcquisitionIntakeStatus } from "@prisma/client";

export type CreateHostAcquisitionInput = {
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  city: string;
  propertyCategory: string;
  source: "airbnb" | "direct" | "referral" | "other";
  notes?: string | null;
  sourceListingUrl?: string | null;
};

function mapSource(s: CreateHostAcquisitionInput["source"]): ListingAcquisitionSourceType {
  switch (s) {
    case "airbnb":
      return ListingAcquisitionSourceType.HOST;
    case "direct":
      return ListingAcquisitionSourceType.OWNER;
    case "referral":
      return ListingAcquisitionSourceType.MANUAL;
    default:
      return ListingAcquisitionSourceType.MANUAL;
  }
}

export async function createHostAcquisitionLead(input: CreateHostAcquisitionInput) {
  return prisma.listingAcquisitionLead.create({
    data: {
      sourceType: mapSource(input.source),
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim().toLowerCase(),
      contactPhone: input.contactPhone?.trim() || null,
      city: input.city.trim(),
      propertyCategory: input.propertyCategory.trim(),
      notes: input.notes?.trim() || null,
      sourceListingUrl: input.sourceListingUrl?.trim() || null,
      sourcePlatformText: `web_host_acquisition:${input.source}`,
      permissionStatus: ListingAcquisitionPermissionStatus.UNKNOWN,
      intakeStatus: ListingAcquisitionIntakeStatus.NEW,
    },
  });
}
