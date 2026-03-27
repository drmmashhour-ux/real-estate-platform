import {
  BnhubTrustGeocodeProvider,
  BnhubTrustGeocodeStatus,
  BnhubTrustIdentityAuditActor,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { GoogleGeocodingAdapter } from "@/modules/bnhub-trust/connectors/googleGeocodingAdapter";
import { logAddressAction } from "@/modules/bnhub-trust/services/trustDecisionAuditService";

const geo = new GoogleGeocodingAdapter();

export async function geocodeListingAddress(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, address: true, city: true, region: true, country: true, latitude: true, longitude: true },
  });
  if (!listing) return;
  const raw = [listing.address, listing.city, listing.region, listing.country].filter(Boolean).join(", ");
  const normalized = geo.normalizeAddress(raw);
  const res = await geo.geocodeAddress(normalized);

  if ("error" in res) {
    await upsertAddressVerification({
      listingId,
      rawAddress: raw,
      normalizedAddress: null,
      geocodeProvider: BnhubTrustGeocodeProvider.GOOGLE_GEOCODING,
      geocodeStatus: BnhubTrustGeocodeStatus.NEEDS_REVIEW,
      latitude: listing.latitude ?? undefined,
      longitude: listing.longitude ?? undefined,
      placeMetadataJson: { error: res.error },
      mismatchFlagsJson: {},
      confidenceScore: 0,
    });
    return;
  }

  const cmp = geo.compareAddressComponents(
    { city: listing.city, region: listing.region, country: listing.country },
    res.placeMetadata
  );
  const hasMismatch = cmp.mismatchFlags.length > 0;
  const status = hasMismatch
    ? BnhubTrustGeocodeStatus.PARTIAL_MATCH
    : res.confidence === "high"
      ? BnhubTrustGeocodeStatus.SUCCESS
      : BnhubTrustGeocodeStatus.PARTIAL_MATCH;

  await upsertAddressVerification({
    listingId,
    rawAddress: raw,
    normalizedAddress: res.normalizedAddress,
    geocodeProvider: BnhubTrustGeocodeProvider.GOOGLE_GEOCODING,
    geocodeStatus: status,
    latitude: res.latitude,
    longitude: res.longitude,
    placeMetadataJson: res.placeMetadata as object,
    mismatchFlagsJson: { flags: cmp.mismatchFlags },
    confidenceScore: geo.mapConfidence(res),
  });
}

export async function upsertAddressVerification(data: {
  listingId: string;
  rawAddress: string;
  normalizedAddress: string | null;
  geocodeProvider: BnhubTrustGeocodeProvider;
  geocodeStatus: BnhubTrustGeocodeStatus;
  latitude?: number | null;
  longitude?: number | null;
  placeMetadataJson: object;
  mismatchFlagsJson: object;
  confidenceScore: number;
}) {
  await prisma.bnhubAddressVerification.upsert({
    where: { listingId: data.listingId },
    create: {
      listingId: data.listingId,
      rawAddress: data.rawAddress,
      normalizedAddress: data.normalizedAddress,
      geocodeProvider: data.geocodeProvider,
      geocodeStatus: data.geocodeStatus,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      placeMetadataJson: data.placeMetadataJson,
      mismatchFlagsJson: data.mismatchFlagsJson,
      confidenceScore: data.confidenceScore,
    },
    update: {
      rawAddress: data.rawAddress,
      normalizedAddress: data.normalizedAddress,
      geocodeProvider: data.geocodeProvider,
      geocodeStatus: data.geocodeStatus,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      placeMetadataJson: data.placeMetadataJson,
      mismatchFlagsJson: data.mismatchFlagsJson,
      confidenceScore: data.confidenceScore,
    },
  });
  await logAddressAction({
    actorType: BnhubTrustIdentityAuditActor.SYSTEM,
    listingId: data.listingId,
    actionType: "address_verification_upsert",
    actionSummary: `Geocode status ${data.geocodeStatus}`,
    after: { confidence: data.confidenceScore },
  });
}

export async function validateListingAddress(listingId: string) {
  await geocodeListingAddress(listingId);
  return prisma.bnhubAddressVerification.findUnique({ where: { listingId } });
}

export function normalizeListingAddress(raw: string) {
  return geo.normalizeAddress(raw);
}

export async function detectAddressMismatch(listingId: string) {
  const row = await prisma.bnhubAddressVerification.findUnique({ where: { listingId } });
  if (!row) return { hasMismatch: false, flags: [] as string[] };
  const flags = (row.mismatchFlagsJson as { flags?: string[] })?.flags ?? [];
  return { hasMismatch: flags.length > 0, flags };
}
