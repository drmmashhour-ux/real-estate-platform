/**
 * Read-only context assembly for certificate-of-location helper — no fabricated values.
 */

import { prisma } from "@/lib/db";
import type { CertificateOfLocationContext } from "./certificate-of-location.types";
import { looksLikeCertificateOfLocationType } from "./certificate-of-location-helpers";

export type BuildCertificateOfLocationContextParams = {
  listingId: string;
  brokerFlow?: boolean;
  offerStage?: boolean;
};

function note(target: string[], msg: string): void {
  if (!target.includes(msg)) target.push(msg);
}

export async function buildCertificateOfLocationContextFromDb(
  params: BuildCertificateOfLocationContextParams,
): Promise<CertificateOfLocationContext> {
  const availabilityNotes: string[] = [];
  const listingId = typeof params.listingId === "string" ? params.listingId.trim() : "";
  if (!listingId) {
    return {
      listingId: "",
      availabilityNotes: ["listing_id_missing"],
      brokerFlow: params.brokerFlow,
      offerStage: params.offerStage,
    };
  }

  try {
    const listing = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: {
        propertyType: true,
        status: true,
        country: true,
        region: true,
        updatedAt: true,
        sellerDeclarationJson: true,
        address: true,
        city: true,
        cadastreNumber: true,
      },
    });

    if (!listing) {
      note(availabilityNotes, "fsbo_listing_not_found");
      return {
        listingId,
        brokerFlow: params.brokerFlow,
        offerStage: params.offerStage,
        availabilityNotes,
      };
    }

    const legalRows = await prisma.legalRecord.findMany({
      where: { entityType: "fsbo_listing", entityId: listingId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        recordType: true,
        status: true,
        parsedData: true,
        validation: true,
        createdAt: true,
      },
    });

    const legalRecords = legalRows.map((r) => ({
      id: r.id,
      recordType: r.recordType,
      status: r.status,
      parsedData: r.parsedData,
      validation: r.validation,
      createdAt: r.createdAt.toISOString(),
    }));

    const slotRows = await prisma.fsboListingDocument.findMany({
      where: { fsboListingId: listingId },
      select: { docType: true, status: true, updatedAt: true },
    });

    const uploadedDocuments = slotRows.map((d) => ({
      docType: d.docType,
      status: d.status,
      updatedAt: d.updatedAt.toISOString(),
    }));

    const supporting = await prisma.sellerSupportingDocument.findMany({
      where: { fsboListingId: listingId, category: "CERTIFICATES_WARRANTIES" },
      select: { id: true, status: true, originalFileName: true, createdAt: true },
      take: 12,
      orderBy: { createdAt: "desc" },
    });

    for (const s of supporting) {
      uploadedDocuments.push({
        docType: "seller_supporting",
        category: "CERTIFICATES_WARRANTIES",
        status: s.status,
        label: s.originalFileName.replace(/[^\w.\-]+/g, "_").slice(0, 80),
        createdAt: s.createdAt.toISOString(),
      });
    }

    let colRecord = legalRecords.find(
      (r) => r.recordType === "compliance_document" && looksLikeCertificateOfLocationType(String((r.parsedData as Record<string, unknown> | null)?.certificateType ?? "")),
    );

    if (!colRecord) {
      colRecord = legalRecords.find(
        (r) => r.recordType === "compliance_document" && String(r.parsedData?.certificateType ?? "").toLowerCase().includes("location"),
      );
    }

    let parsedRecordData: Record<string, unknown> | null =
      colRecord?.parsedData && typeof colRecord.parsedData === "object" ? (colRecord.parsedData as Record<string, unknown>) : null;

    let validationSummary: Record<string, unknown> | null = null;
    if (colRecord?.validation && typeof colRecord.validation === "object") {
      validationSummary = colRecord.validation as Record<string, unknown>;
    }

    const slotCert = slotRows.find((s) => s.docType === "certificate_optional");
    const certificateSlotUploaded = slotCert && ["uploaded", "pending_review", "approved"].includes(slotCert.status);

    let changedSinceCertificate: boolean | null = null;
    const issueRaw = typeof parsedRecordData?.issueDate === "string" ? parsedRecordData.issueDate : null;
    if (issueRaw) {
      const issueMs = Date.parse(issueRaw);
      if (Number.isFinite(issueMs) && listing.updatedAt) {
        changedSinceCertificate = listing.updatedAt.getTime() > issueMs + 86_400_000;
      }
    }

    const decl = listing.sellerDeclarationJson;
    if (decl && typeof decl === "object") {
      const d = decl as Record<string, unknown>;
      const ren = d.renovationsCompleted ?? d.renovations;
      if (ren === true || (typeof ren === "string" && ren.trim() !== "")) {
        if (changedSinceCertificate === null) changedSinceCertificate = true;
        note(availabilityNotes, "seller_declaration_hints_renovation_or_work");
      }
    }

    if (!colRecord && certificateSlotUploaded) {
      note(availabilityNotes, "certificate_slot_uploaded_without_structured_legal_record");
    }

    return {
      listingId,
      propertyType: listing.propertyType,
      listingStatus: listing.status,
      listingCountry: listing.country,
      listingRegion: listing.region,
      listingAddress: listing.address,
      listingCity: listing.city,
      listingCadastre: listing.cadastreNumber,
      fsboListingUpdatedAt: listing.updatedAt.toISOString(),
      legalRecords,
      uploadedDocuments,
      parsedRecordData,
      validationSummary,
      brokerFlow: params.brokerFlow,
      offerStage: params.offerStage,
      changedSinceCertificate,
      availabilityNotes,
    };
  } catch {
    return {
      listingId,
      brokerFlow: params.brokerFlow,
      offerStage: params.offerStage,
      availabilityNotes: ["context_build_failed"],
    };
  }
}
