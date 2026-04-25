import type { FsboListing, Listing } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { normalizeAnyPublicListingCode } from "@/lib/listing-code-public";
import { isActiveOaciqLicenceOnFile } from "@/lib/trust/broker-trust";

export type ResolvedPublicListing =
  | {
      kind: "fsbo";
      row: FsboListing & {
        owner: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          sellerProfileAddress: string | null;
          brokerVerifications: Array<{
            licenseNumber: string;
            brokerageCompany: string;
            verificationStatus: string;
          }>;
          lecipmBrokerLicenceProfile: {
            licenceNumber: string | null;
            licenceStatus: string;
            practiceMode: string | null;
            regulator: string | null;
            fullName: string | null;
          } | null;
        };
        externalListings: Array<{ id: string; status: string }>;
      };
    }
  | {
      kind: "crm";
      row: Listing & {
        owner?: {
          id: string;
          email: string | null;
          name: string | null;
          phone: string | null;
          sellerProfileAddress: string | null;
          brokerVerifications: Array<{
            licenseNumber: string;
            brokerageCompany: string;
            verificationStatus: string;
          }>;
          lecipmBrokerLicenceProfile: {
            licenceNumber: string | null;
            licenceStatus: string;
            practiceMode: string | null;
            regulator: string | null;
            fullName: string | null;
          } | null;
        } | null;
      };
    }
  | { kind: "bnhub"; slug: string; id: string; city: string; propertyType: string | null };

/**
 * Resolve `/listings/[id]` to FSBO, CRM `Listing`, or BNHUB `ShortTermListing` (by uuid or public code).
 */
const fsboPublicInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      sellerProfileAddress: true,
      brokerVerifications: {
        select: {
          licenseNumber: true,
          brokerageCompany: true,
          verificationStatus: true,
        },
        take: 1,
        orderBy: { updatedAt: "desc" as const },
      },
      lecipmBrokerLicenceProfile: {
        select: {
          licenceNumber: true,
          licenceStatus: true,
          practiceMode: true,
          regulator: true,
          fullName: true,
        },
      },
    },
  },
  /** CENTRIS syndication badge — only when connector marked SYNCED (never inferred from scraping). */
  externalListings: {
    where: { platform: "CENTRIS", status: "SYNCED" },
    select: { id: true, status: true },
    take: 1,
  },
} as const;

const crmPublicInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      sellerProfileAddress: true,
      brokerVerifications: {
        select: {
          licenseNumber: true,
          brokerageCompany: true,
          verificationStatus: true,
        },
        take: 1,
        orderBy: { updatedAt: "desc" as const },
      },
      lecipmBrokerLicenceProfile: {
        select: {
          licenceNumber: true,
          licenceStatus: true,
          practiceMode: true,
          regulator: true,
          fullName: true,
        },
      },
    },
  },
} as const;

export async function resolvePublicListing(idOrCode: string): Promise<ResolvedPublicListing | null> {
  const raw = idOrCode.trim();
  if (!raw) return null;

  const publicCode = normalizeAnyPublicListingCode(raw);

  let fsbo = await prisma.fsboListing.findUnique({
    where: { id: raw },
    include: fsboPublicInclude,
  });
  if (!fsbo && publicCode) {
    fsbo = await prisma.fsboListing.findFirst({
      where: { listingCode: { equals: publicCode, mode: "insensitive" } },
      include: fsboPublicInclude,
    });
  }
  if (fsbo && isFsboPubliclyVisible(fsbo)) {
    return { kind: "fsbo", row: fsbo };
  }

  let crm = await prisma.listing.findFirst({
    where: { id: raw, crmMarketplaceLive: true },
    include: crmPublicInclude,
  });
  if (!crm && publicCode) {
    crm = await prisma.listing.findFirst({
      where: { listingCode: { equals: publicCode, mode: "insensitive" }, crmMarketplaceLive: true },
      include: crmPublicInclude,
    });
  }
  if (crm) {
    return { kind: "crm", row: crm };
  }

  const bnWhere =
    publicCode != null
      ? { listingCode: { equals: publicCode, mode: "insensitive" as const } }
      : { id: raw };

  const bn = await prisma.shortTermListing.findFirst({
    where: bnWhere,
    select: { id: true, listingCode: true, listingStatus: true, city: true, propertyType: true },
  });
  if (bn && bn.listingStatus === "PUBLISHED") {
    return {
      kind: "bnhub",
      slug: bn.listingCode || bn.id,
      id: bn.id,
      city: bn.city,
      propertyType: bn.propertyType,
    };
  }

  return null;
}

export function mapCrmListingToBuyerPayload(
  row: Listing & {
    owner?: {
      id: string;
      email: string | null;
      name: string | null;
      phone: string | null;
      sellerProfileAddress: string | null;
      brokerVerifications: Array<{
        licenseNumber: string;
        brokerageCompany: string;
        verificationStatus: string;
      }>;
      lecipmBrokerLicenceProfile: {
        licenceNumber: string | null;
        licenceStatus: string;
        practiceMode: string | null;
        regulator: string | null;
        fullName: string | null;
      } | null;
    } | null;
  }
) {
  const priceCents = Math.round(Number(row.price) * 100);
  const brokerVerification = row.owner?.brokerVerifications?.[0] ?? null;
  const licProfile = row.owner?.lecipmBrokerLicenceProfile ?? null;
  const licenseNumber =
    licProfile?.licenceNumber?.trim() || brokerVerification?.licenseNumber || null;
  const licensedActiveOaciq = isActiveOaciqLicenceOnFile(licProfile);
  return {
    id: row.id,
    listingCode: row.listingCode,
    listingOwnerType: "BROKER" as const,
    ownerId: row.ownerId ?? "",
    title: row.title,
    description:
      `Listed on the LECIPM marketplace. Asking price ${(Number(row.price) || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}. Contact the listing representative for details, showings, and documents.`,
    priceCents,
    address: "See listing representative",
    city: "Marketplace",
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    surfaceSqft: null as number | null,
    images: [] as string[],
    coverImage: null as string | null,
    contactEmail: row.owner?.email ?? "info@lecipm.com",
    contactPhone: null as string | null,
    propertyType: "RESIDENTIAL" as string | null,
    yearBuilt: null as number | null,
    annualTaxesCents: null as number | null,
    condoFeesCents: null as number | null,
    cadastreNumber: null as string | null,
    listingKind: "crm" as const,
    representative: {
      name: licProfile?.fullName?.trim() || row.owner?.name || "Listing broker",
      roleLabel: "Listing broker",
      email: row.owner?.email ?? "info@lecipm.com",
      phone: row.owner?.phone ?? null,
      company: brokerVerification?.brokerageCompany ?? "Brokerage on file",
      licenseNumber,
      licenseVerified: brokerVerification?.verificationStatus === "VERIFIED",
      brokerUserId: row.owner?.id ?? null,
      licenceStatus: licProfile?.licenceStatus ?? null,
      practiceMode: licProfile?.practiceMode ?? null,
      licensedActiveOaciq,
      address: row.owner?.sellerProfileAddress ?? null,
    },
    propertyDetails: [
      { label: "Property type", value: "Residential listing" },
      { label: "Listing code", value: row.listingCode },
    ],
    latitude: null,
    longitude: null,
  };
}
