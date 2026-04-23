import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/require-role";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { ComparableSourceType } from "@/modules/deal-analyzer/domain/comparables";
import { isDealAnalyzerCompsEnabled } from "@/modules/deal-analyzer/config";
import {
  distanceKmBetween,
  scoreComparableSimilarity,
} from "@/modules/deal-analyzer/infrastructure/services/comparableScoringService";
import type { ComparableCandidate } from "@/modules/deal-analyzer/domain/comparables";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  /** Subject FSBO listing (the appraisal / deal-analysis property). */
  subjectListingId: z.string().min(1),
  /** Selected comparable FSBO listing id. */
  comparablePropertyId: z.string().min(1),
});

function toCandidate(row: {
  id: string;
  priceCents: number;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  surfaceSqft: number | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
}): ComparableCandidate {
  return {
    id: row.id,
    priceCents: row.priceCents,
    pricePerSqft:
      row.surfaceSqft && row.surfaceSqft > 0 ? row.priceCents / 100 / row.surfaceSqft : null,
    propertyType: row.propertyType,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    areaSqft: row.surfaceSqft,
    listingStatus: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export async function POST(req: Request) {
  if (!isDealAnalyzerCompsEnabled()) {
    return NextResponse.json({ error: "Comparable analysis is disabled" }, { status: 503 });
  }

  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.subjectListingId === body.comparablePropertyId) {
    return NextResponse.json({ error: "Subject and comparable must differ" }, { status: 400 });
  }

  const subjectRow = await prisma.fsboListing.findUnique({
    where: { id: body.subjectListingId },
    select: {
      ownerId: true,
      priceCents: true,
      propertyType: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      status: true,
      latitude: true,
      longitude: true,
    },
  });
  if (!subjectRow) {
    return NextResponse.json({ error: "Subject listing not found" }, { status: 404 });
  }

  const isAdmin = await isPlatformAdmin(auth.user.id);
  if (subjectRow.ownerId !== auth.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const compRow = await prisma.fsboListing.findUnique({
    where: { id: body.comparablePropertyId },
    select: {
      id: true,
      priceCents: true,
      propertyType: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      status: true,
      latitude: true,
      longitude: true,
    },
  });
  if (!compRow) {
    return NextResponse.json({ error: "Comparable listing not found" }, { status: 404 });
  }

  const analysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId: body.subjectListingId },
    orderBy: { createdAt: "desc" },
  });
  if (!analysis?.id) {
    return NextResponse.json(
      { error: "No deal analysis for this listing — run Phase 1 analysis first." },
      { status: 400 },
    );
  }

  const subject = toCandidate({
    id: body.subjectListingId,
    priceCents: subjectRow.priceCents,
    propertyType: subjectRow.propertyType,
    bedrooms: subjectRow.bedrooms,
    bathrooms: subjectRow.bathrooms,
    surfaceSqft: subjectRow.surfaceSqft,
    status: subjectRow.status,
    latitude: subjectRow.latitude,
    longitude: subjectRow.longitude,
  });
  const comp = toCandidate(compRow);

  const similarityScore = scoreComparableSimilarity(subject, comp);
  const distanceKm = distanceKmBetween(subject, comp);

  const existing = await prisma.dealAnalysisComparable.findFirst({
    where: { analysisId: analysis.id, comparablePropertyId: comp.id },
  });
  if (existing) {
    return NextResponse.json({ success: true, id: existing.id, deduped: true });
  }

  const created = await prisma.dealAnalysisComparable.create({
    data: {
      analysisId: analysis.id,
      comparablePropertyId: comp.id,
      distanceKm,
      similarityScore,
      sourceType: ComparableSourceType.FSBO,
      priceCents: comp.priceCents,
      pricePerSqft: comp.pricePerSqft,
      propertyType: comp.propertyType,
      bedrooms: comp.bedrooms,
      bathrooms: comp.bathrooms,
      areaSqft: comp.areaSqft,
      listingStatus: comp.listingStatus,
      details: { source: "map_manual" },
    },
  });

  return NextResponse.json({ success: true, id: created.id });
}
