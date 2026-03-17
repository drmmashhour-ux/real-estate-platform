/**
 * Compare AI-extracted document values with listing and identity.
 * Score: cadastre 40, owner 40, address 20. Overall status: match | partial_match | mismatch.
 */

import { prisma } from "@/lib/db";
import type { MatchStatus } from "@prisma/client";

const CADASTRE_POINTS = 40;
const OWNER_POINTS = 40;
const ADDRESS_POINTS = 20;

function norm(s: string | null | undefined): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toMatchStatus(match: boolean, partial: boolean): MatchStatus {
  if (match) return "MATCH";
  if (partial) return "PARTIAL_MATCH";
  return "MISMATCH";
}

function compareCadastre(extracted: string | null, listing: string | null): { status: MatchStatus; points: number } {
  const e = norm(extracted);
  const l = norm(listing);
  if (!e || !l) return { status: "MISMATCH", points: 0 };
  if (e === l) return { status: "MATCH", points: CADASTRE_POINTS };
  if (e.includes(l) || l.includes(e)) return { status: "PARTIAL_MATCH", points: Math.floor(CADASTRE_POINTS * 0.5) };
  return { status: "MISMATCH", points: 0 };
}

function compareAddress(extracted: string | null, listing: string | null): { status: MatchStatus; points: number } {
  const e = norm(extracted);
  const l = norm(listing);
  if (!e || !l) return { status: "MISMATCH", points: 0 };
  if (e === l) return { status: "MATCH", points: ADDRESS_POINTS };
  if (e.includes(l) || l.includes(e)) return { status: "PARTIAL_MATCH", points: Math.floor(ADDRESS_POINTS * 0.6) };
  const eWords = e.split(/\s+/).filter((w) => w.length > 2);
  const matchCount = eWords.filter((w) => l.includes(w)).length;
  if (matchCount >= Math.min(3, eWords.length)) return { status: "PARTIAL_MATCH", points: Math.floor(ADDRESS_POINTS * 0.4) };
  return { status: "MISMATCH", points: 0 };
}

function compareOwner(extracted: string | null, userName: string | null): { status: MatchStatus; points: number } {
  const e = norm(extracted);
  const u = norm(userName);
  if (!e || !u) return { status: "MISMATCH", points: 0 };
  if (e === u) return { status: "MATCH", points: OWNER_POINTS };
  if (e.includes(u) || u.includes(e)) return { status: "MATCH", points: OWNER_POINTS };
  const uParts = u.split(/\s+/).filter((p) => p.length > 1);
  const allMatch = uParts.every((p) => e.includes(p));
  if (allMatch && uParts.length >= 2) return { status: "PARTIAL_MATCH", points: Math.floor(OWNER_POINTS * 0.7) };
  return { status: "MISMATCH", points: 0 };
}

export type MatchResult = {
  cadastreMatch: MatchStatus;
  addressMatch: MatchStatus;
  ownerMatch: MatchStatus;
  overallStatus: MatchStatus;
  verificationScore: number;
};

export async function computeVerificationMatch(
  listingId: string,
  documentExtractionId: string
): Promise<MatchResult> {
  const extraction = await prisma.documentExtraction.findUnique({
    where: { id: documentExtractionId },
    include: { document: { include: { listing: { include: { owner: true } } } } },
  });
  if (!extraction?.document?.listing || extraction.document.listingId !== listingId) {
    throw new Error("Extraction or listing not found");
  }
  const listing = extraction.document.listing;
  const listingCadastre = listing.cadastreNumber ?? null;
  const listingAddress = listing.address ?? null;
  const ownerName = listing.owner?.name ?? null;

  const cadastreResult = compareCadastre(extraction.cadastreNumber, listingCadastre);
  const addressResult = compareAddress(extraction.propertyAddress, listingAddress);
  const ownerResult = compareOwner(extraction.ownerName, ownerName);

  const totalPoints =
    cadastreResult.points + addressResult.points + ownerResult.points;
  const overallStatus: MatchStatus =
    totalPoints >= 80 ? "MATCH" : totalPoints >= 40 ? "PARTIAL_MATCH" : "MISMATCH";

  await prisma.verificationMatch.upsert({
    where: { listingId },
    create: {
      listingId,
      documentExtractionId,
      cadastreMatch: cadastreResult.status,
      addressMatch: addressResult.status,
      ownerMatch: ownerResult.status,
      overallStatus,
      verificationScore: totalPoints,
    },
    update: {
      documentExtractionId,
      cadastreMatch: cadastreResult.status,
      addressMatch: addressResult.status,
      ownerMatch: ownerResult.status,
      overallStatus,
      verificationScore: totalPoints,
    },
  });

  return {
    cadastreMatch: cadastreResult.status,
    addressMatch: addressResult.status,
    ownerMatch: ownerResult.status,
    overallStatus,
    verificationScore: totalPoints,
  };
}

export async function createFraudAlertsIfNeeded(
  listingId: string,
  extraction: { cadastreNumber: string | null; ownerName: string | null; propertyAddress: string | null; confidenceScore: number | null },
  documentId: string
): Promise<void> {
  const alerts: { alertType: string; message: string; severity: string }[] = [];

  if ((extraction.confidenceScore ?? 0) < 0.5) {
    alerts.push({
      alertType: "low_confidence",
      message: "Document AI confidence score is low; manual review recommended.",
      severity: "medium",
    });
  }
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: { owner: true },
  });
  if (listing) {
    const ownerNorm = (listing.owner?.name ?? "").trim().toLowerCase();
    const extractedOwnerNorm = (extraction.ownerName ?? "").trim().toLowerCase();
    if (extractedOwnerNorm && ownerNorm && !extractedOwnerNorm.includes(ownerNorm) && !ownerNorm.includes(extractedOwnerNorm)) {
      alerts.push({
        alertType: "owner_mismatch",
        message: "Extracted owner name does not match listing host name.",
        severity: "high",
      });
    }
    const addrNorm = (listing.address ?? "").trim().toLowerCase();
    const extractedAddrNorm = (extraction.propertyAddress ?? "").trim().toLowerCase();
    if (extractedAddrNorm && addrNorm && !extractedAddrNorm.includes(addrNorm) && !addrNorm.includes(extractedAddrNorm)) {
      alerts.push({
        alertType: "address_mismatch",
        message: "Extracted address does not match listing address.",
        severity: "high",
      });
    }
  }
  if (extraction.cadastreNumber) {
    const duplicate = await prisma.shortTermListing.findFirst({
      where: {
        cadastreNumber: extraction.cadastreNumber.trim(),
        listingVerificationStatus: { in: ["PENDING_VERIFICATION", "VERIFIED"] },
        id: { not: listingId },
      },
    });
    if (duplicate) {
      alerts.push({
        alertType: "duplicate_cadastre",
        message: "Cadastre number appears on another active listing.",
        severity: "high",
      });
    }
  }

  for (const a of alerts) {
    await prisma.verificationFraudAlert.create({
      data: {
        listingId,
        alertType: a.alertType,
        message: a.message,
        severity: a.severity,
        metadata: { documentId },
      },
    });
  }
}
