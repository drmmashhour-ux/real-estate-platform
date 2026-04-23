import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { formatAssistantChecklistMessage } from "@/lib/bnhub/host-verification-assistant";
import {
  buildModerationRequirements,
  hasBlockingMissingRequirements,
  type ModerationListingForRequirements,
} from "@/lib/bnhub/moderation-requirements";
import { loadShortTermListingForRequirements } from "@/lib/bnhub/verification";
import { submitListingForVerification } from "@/lib/verification/ownership";
import { runFraudChecks } from "@/lib/verification/fraud-flags";

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      listingId,
      listingAuthorityType,
      cadastreNumber,
      municipality,
      province,
      address,
      brokerLicenseNumber,
      brokerageName,
    } = body;

    if (!listingId || !listingAuthorityType || !cadastreNumber || !municipality || !province || !address) {
      return Response.json(
        {
          error:
            "listingId, listingAuthorityType, cadastreNumber, municipality, province, address required",
        },
        { status: 400 }
      );
    }

    if (listingAuthorityType !== "OWNER" && listingAuthorityType !== "BROKER") {
      return Response.json(
        { error: "listingAuthorityType must be OWNER or BROKER" },
        { status: 400 }
      );
    }

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true, address: true },
    });
    if (!listing || listing.ownerId !== userId) {
      return Response.json({ error: "Listing not found or access denied" }, { status: 404 });
    }

    const docs = await prisma.propertyDocument.findMany({
      where: { listingId },
      select: { documentType: true },
    });
    const hasLandRegistryExtract = docs.some((d) => d.documentType === "LAND_REGISTRY_EXTRACT");
    const hasBrokerAuthorization = docs.some((d) => d.documentType === "BROKER_AUTHORIZATION");

    const row = await loadShortTermListingForRequirements(listingId);
    if (!row) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const effectiveDocRows = [...row.propertyDocuments];
    if (hasLandRegistryExtract && !docs.some((d) => d.documentType === "LAND_REGISTRY_EXTRACT")) {
      effectiveDocRows.push({ id: "__submit_claimed_land_registry__" });
    }
    if (
      listingAuthorityType === "BROKER" &&
      hasBrokerAuthorization &&
      !docs.some((d) => d.documentType === "BROKER_AUTHORIZATION")
    ) {
      effectiveDocRows.push({ id: "__submit_claimed_broker_auth__" });
    }

    const synthetic: ModerationListingForRequirements = {
      ...row,
      address: String(address).trim(),
      cadastreNumber: String(cadastreNumber).trim(),
      municipality: String(municipality).trim(),
      province: String(province).trim(),
      listingAuthorityType,
      brokerLicenseNumber:
        listingAuthorityType === "BROKER"
          ? String(brokerLicenseNumber || "").trim() || null
          : row.brokerLicenseNumber,
      brokerageName:
        listingAuthorityType === "BROKER"
          ? String(brokerageName || "").trim() || null
          : row.brokerageName,
      propertyDocuments: effectiveDocRows,
    };

    const preSubmitRequirements = buildModerationRequirements(synthetic, {
      omitKeys: new Set(["property_verification"]),
    });
    if (hasBlockingMissingRequirements(preSubmitRequirements)) {
      return Response.json(
        {
          code: "CHECKLIST_INCOMPLETE",
          error: "Verification checklist incomplete — fix missing items before submitting.",
          requirements: preSubmitRequirements,
          assistantMessage: formatAssistantChecklistMessage(row.title, preSubmitRequirements),
        },
        { status: 400 }
      );
    }

    const photosReq = preSubmitRequirements.find((r) => r.key === "photos");
    if (photosReq && photosReq.status !== "complete") {
      return Response.json(
        {
          code: "PHOTOS_INSUFFICIENT",
          error:
            "Photo set is not ready for review — upload at least 10 clear images covering the whole unit, beds, bathrooms, kitchen, and amenities.",
          requirements: preSubmitRequirements,
          assistantMessage: formatAssistantChecklistMessage(row.title, preSubmitRequirements),
        },
        { status: 400 }
      );
    }

    const result = await submitListingForVerification({
      listingId,
      ownerId: userId,
      listingAuthorityType,
      cadastreNumber: String(cadastreNumber).trim(),
      municipality: String(municipality).trim(),
      province: String(province).trim(),
      address: String(address).trim(),
      brokerLicenseNumber:
        listingAuthorityType === "BROKER" ? String(brokerLicenseNumber || "").trim() : undefined,
      brokerageName:
        listingAuthorityType === "BROKER" ? String(brokerageName || "").trim() : undefined,
      hasLandRegistryExtract,
      hasBrokerAuthorization,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    const fraudFlags = await runFraudChecks({
      listingId,
      cadastreNumber: String(cadastreNumber).trim(),
      userId,
      userDisplayName: null,
      excludeListingId: listingId,
    });

    return Response.json({
      success: true,
      listingVerificationStatus: result.listingVerificationStatus,
      fraudFlags: fraudFlags.length > 0 ? fraudFlags : undefined,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Submit failed" },
      { status: 500 }
    );
  }
}
