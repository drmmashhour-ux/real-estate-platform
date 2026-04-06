import type { ListingAuthorityType } from "@prisma/client";

/** Minimum photos before admin can approve and before we treat the photo row as complete. */
export const MIN_LISTING_PHOTOS_FOR_VERIFICATION = 10;

export type ModerationRequirementStatus = "complete" | "partial" | "missing";

export type ModerationRequirement = {
  key: string;
  label: string;
  status: ModerationRequirementStatus;
  hint?: string;
};

/** Shape expected from `getListingsPendingVerification` include (see verification.ts). */
export type ModerationListingForRequirements = {
  title: string;
  address: string;
  city: string;
  region: string | null;
  province: string | null;
  country: string;
  cadastreNumber: string | null;
  municipality: string | null;
  listingAuthorityType: ListingAuthorityType | null;
  brokerLicenseNumber: string | null;
  brokerageName: string | null;
  nightPriceCents: number;
  verificationDocUrl: string | null;
  photos: unknown;
  listingPhotos: { id: string }[];
  propertyDocuments: { id: string }[];
  propertyVerification: { verificationStatus: string; cadastreNumber: string | null } | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    stripeOnboardingComplete: boolean;
    identityVerifications: {
      verificationStatus: string;
      governmentIdFileUrl: string | null;
      selfiePhotoUrl: string | null;
    }[];
    brokerVerifications: { verificationStatus: string }[];
    bnhubTrustIdentityVerifications: { verificationStatus: string }[];
  };
};

/** Count stored photos (DB rows preferred, else legacy JSON `photos` array). */
export function moderationPhotoCount(listing: {
  photos: unknown;
  listingPhotos: { id: string }[];
}): number {
  if (listing.listingPhotos.length > 0) return listing.listingPhotos.length;
  if (Array.isArray(listing.photos)) return listing.photos.length;
  return 0;
}

function listingPhotosHint(count: number): string | undefined {
  if (count >= MIN_LISTING_PHOTOS_FOR_VERIFICATION) return undefined;
  return [
    count === 0
      ? `Add at least ${MIN_LISTING_PHOTOS_FOR_VERIFICATION} photos.`
      : `You have ${count} of ${MIN_LISTING_PHOTOS_FOR_VERIFICATION} required photos.`,
    "Cover the whole stay: overall layout, each sleeping area, every bathroom, the full kitchen, and key amenities (parking, laundry, balcony, workspace, etc.).",
    "Use sharp, well-lit images. JPEG, PNG, HEIC (Apple), and WebP are accepted; they must look clear on phones, tablets, and laptops.",
  ].join("\n");
}

function isQuebecCadastreRelevant(listing: ModerationListingForRequirements): boolean {
  if (listing.country?.toUpperCase() === "CA") return true;
  const p = `${listing.province ?? ""} ${listing.region ?? ""}`.toUpperCase();
  return p.includes("QC") || p.includes("QUEBEC") || p.includes("QUÉBEC");
}

function hostIdentityStatus(listing: ModerationListingForRequirements): ModerationRequirement {
  const idv = listing.owner.identityVerifications[0];
  const trust = listing.owner.bnhubTrustIdentityVerifications[0];

  if (idv?.verificationStatus === "VERIFIED" || trust?.verificationStatus === "VERIFIED") {
    return { key: "host_identity", label: "Host identity (ID / trust check)", status: "complete" };
  }
  const hasLegacyUploads = Boolean(idv?.governmentIdFileUrl && idv?.selfiePhotoUrl);
  const trustPending =
    trust &&
    ["PENDING", "REQUIRES_INPUT"].includes(trust.verificationStatus);
  if (hasLegacyUploads || trustPending) {
    return {
      key: "host_identity",
      label: "Host identity (ID / trust check)",
      status: "partial",
      hint: "Documents or session present; identity not verified yet.",
    };
  }
  return {
    key: "host_identity",
    label: "Host identity (ID / trust check)",
    status: "missing",
    hint: "No verified identity and no completed ID upload / trust session.",
  };
}

function brokerStatus(listing: ModerationListingForRequirements): ModerationRequirement | null {
  if (listing.listingAuthorityType !== "BROKER") return null;

  const onListing = Boolean(
    listing.brokerLicenseNumber?.trim() && listing.brokerageName?.trim()
  );
  const bv = listing.owner.brokerVerifications[0];

  if (bv?.verificationStatus === "VERIFIED") {
    return { key: "broker_license", label: "Broker license & brokerage", status: "complete" };
  }
  if (onListing && bv?.verificationStatus === "PENDING") {
    return {
      key: "broker_license",
      label: "Broker license & brokerage",
      status: "partial",
      hint: "License on listing; broker verification still pending.",
    };
  }
  if (onListing) {
    return {
      key: "broker_license",
      label: "Broker license & brokerage",
      status: "partial",
      hint: "License details on listing; no verified broker record.",
    };
  }
  return {
    key: "broker_license",
    label: "Broker license & brokerage",
    status: "missing",
    hint: "Add brokerage name, license number, and broker verification.",
  };
}

export type BuildModerationRequirementsOptions = {
  /** Omit rows (e.g. `property_verification` before the ownership submit creates that record). */
  omitKeys?: Set<string>;
};

export function buildModerationRequirements(
  listing: ModerationListingForRequirements,
  options?: BuildModerationRequirementsOptions
): ModerationRequirement[] {
  const omit = options?.omitKeys ?? new Set<string>();
  const items: ModerationRequirement[] = [];
  const add = (r: ModerationRequirement) => {
    if (!omit.has(r.key)) items.push(r);
  };

  const hasHostName = Boolean(listing.owner.name?.trim());
  add({
    key: "host_profile",
    label: "Host profile (display name)",
    status: hasHostName ? "complete" : "partial",
    hint: hasHostName ? undefined : "Only email is shown; consider asking for a display name.",
  });

  add(hostIdentityStatus(listing));

  const broker = brokerStatus(listing);
  if (broker) add(broker);

  const addrOk = Boolean(listing.address?.trim() && listing.city?.trim());
  const regionOk = Boolean(listing.region?.trim() || listing.province?.trim());
  add({
    key: "address",
    label: "Listing address & location",
    status: addrOk && regionOk ? "complete" : addrOk ? "partial" : "missing",
    hint:
      !addrOk
        ? "Street address and city are required."
        : !regionOk
          ? "Add province / region for compliance."
          : undefined,
  });

  if (isQuebecCadastreRelevant(listing)) {
    const cadastreOk = Boolean(
      listing.cadastreNumber?.trim() &&
        listing.municipality?.trim() &&
        (listing.province?.trim() || listing.region?.trim())
    );
    add({
      key: "cadastre",
      label: "Cadastre & municipality (ownership baseline)",
      status: cadastreOk ? "complete" : "missing",
      hint: cadastreOk ? undefined : "Quebec listings need cadastre, municipality, and province.",
    });
  }

  const pv = listing.propertyVerification;
  add({
    key: "property_verification",
    label: "Property verification record",
    status: pv
      ? pv.verificationStatus === "VERIFIED"
        ? "complete"
        : "partial"
      : "missing",
    hint: pv ? undefined : "No property_verifications row — host may not have submitted ownership flow.",
  });

  const docsOk =
    listing.propertyDocuments.length > 0 || Boolean(listing.verificationDocUrl?.trim());
  add({
    key: "ownership_doc",
    label: "Ownership / authorization document",
    status: docsOk ? "complete" : "missing",
    hint: docsOk ? undefined : "Upload land registry extract or broker authorization in property documents.",
  });

  const n = moderationPhotoCount(listing);
  add({
    key: "photos",
    label: `Listing photos (minimum ${MIN_LISTING_PHOTOS_FOR_VERIFICATION})`,
    status:
      n >= MIN_LISTING_PHOTOS_FOR_VERIFICATION ? "complete" : n >= 1 ? "partial" : "missing",
    hint: listingPhotosHint(n),
  });

  add({
    key: "pricing",
    label: "Nightly price",
    status: listing.nightPriceCents > 0 ? "complete" : "missing",
    hint: listing.nightPriceCents > 0 ? undefined : "Set a valid nightly price.",
  });

  add({
    key: "stripe_connect",
    label: "Host payouts (Stripe Connect)",
    status: listing.owner.stripeOnboardingComplete ? "complete" : "partial",
    hint: listing.owner.stripeOnboardingComplete
      ? undefined
      : "Host has not finished Connect onboarding — payouts may be blocked.",
  });

  return items;
}

export function moderationRequirementsBlocking(
  requirements: ModerationRequirement[]
): ModerationRequirement[] {
  return requirements.filter((r) => r.status === "missing");
}

/** Block host submit / treat as failing gate when any row is missing (not partial). */
export function hasBlockingMissingRequirements(requirements: ModerationRequirement[]): boolean {
  return requirements.some((r) => r.status === "missing");
}

export function allModerationRequirementsComplete(requirements: ModerationRequirement[]): boolean {
  return requirements.every((r) => r.status === "complete");
}

export function getIncompleteModerationRequirements(
  requirements: ModerationRequirement[]
): ModerationRequirement[] {
  return requirements.filter((r) => r.status !== "complete");
}
