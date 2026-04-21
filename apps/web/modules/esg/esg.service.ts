import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { buildEsgRecommendations, computeEsgScore } from "@/modules/esg/esg-score.engine";
import type { EsgBadgePayload, EsgGrade, EsgProfilePayload } from "@/modules/esg/esg.types";

const TAG = "[esg]";
const TAG_SCORE = "[esg-score]";

function toPayload(row: {
  energyScore: number | null;
  carbonScore: number | null;
  sustainabilityScore: number | null;
  certification: string | null;
  solar: boolean;
  renovation: boolean;
  highCarbonMaterials: boolean;
}): EsgProfilePayload {
  return {
    energyScore: row.energyScore,
    carbonScore: row.carbonScore,
    sustainabilityScore: row.sustainabilityScore,
    certification: row.certification,
    solar: row.solar,
    renovation: row.renovation,
    highCarbonMaterials: row.highCarbonMaterials,
  };
}

/** Minimum composite to show public ESG badge on listing */
export const ESG_PUBLIC_BADGE_MIN_SCORE = 55;

export async function syncEsgScoreForListing(listingId: string): Promise<void> {
  const profile = await prisma.esgProfile.findUnique({ where: { listingId } });
  if (!profile) return;
  const payload = toPayload(profile);
  const result = computeEsgScore(payload);
  await prisma.esgProfile.update({
    where: { listingId },
    data: {
      compositeScore: result.score,
      grade: result.grade,
    },
  });
  logInfo(`${TAG_SCORE} persisted`, { listingId, score: result.score, grade: result.grade });
}

function mergeEsgPatch(
  existing: {
    energyScore: number | null;
    carbonScore: number | null;
    sustainabilityScore: number | null;
    certification: string | null;
    solar: boolean;
    renovation: boolean;
    highCarbonMaterials: boolean;
  } | null,
  patch: Partial<{
    energyScore: number | null;
    carbonScore: number | null;
    sustainabilityScore: number | null;
    certification: string | null;
    solar: boolean;
    renovation: boolean;
    highCarbonMaterials: boolean;
  }>
) {
  return {
    energyScore: patch.energyScore !== undefined ? patch.energyScore : existing?.energyScore ?? null,
    carbonScore: patch.carbonScore !== undefined ? patch.carbonScore : existing?.carbonScore ?? null,
    sustainabilityScore:
      patch.sustainabilityScore !== undefined ? patch.sustainabilityScore : existing?.sustainabilityScore ?? null,
    certification: patch.certification !== undefined ? patch.certification : existing?.certification ?? null,
    solar: patch.solar !== undefined ? patch.solar : existing?.solar ?? false,
    renovation: patch.renovation !== undefined ? patch.renovation : existing?.renovation ?? false,
    highCarbonMaterials:
      patch.highCarbonMaterials !== undefined ? patch.highCarbonMaterials : existing?.highCarbonMaterials ?? false,
  };
}

export async function upsertEsgProfile(
  listingId: string,
  data: Partial<{
    energyScore: number | null;
    carbonScore: number | null;
    sustainabilityScore: number | null;
    certification: string | null;
    solar: boolean;
    renovation: boolean;
    highCarbonMaterials: boolean;
  }>
): Promise<{ id: string }> {
  const existing = await prisma.esgProfile.findUnique({ where: { listingId } });
  const merged = mergeEsgPatch(existing, data);
  const result = computeEsgScore(toPayload(merged));

  const row = await prisma.esgProfile.upsert({
    where: { listingId },
    create: {
      listingId,
      ...merged,
      compositeScore: result.score,
      grade: result.grade,
    },
    update: {
      ...merged,
      compositeScore: result.score,
      grade: result.grade,
    },
    select: { id: true },
  });

  logInfo(`${TAG} profile.upsert`, { listingId, score: result.score });
  import("@/modules/investor/investor-artifact-triggers")
    .then(({ recordInvestorArtifactStaleSignal }) => {
      recordInvestorArtifactStaleSignal(listingId, ["ESG_PROFILE_UPSERT"]);
    })
    .catch(() => {});
  return row;
}

/** Create stub profile + computed grade when a listing is published or edited (idempotent). */
export async function ensureEsgProfileForListing(listingId: string): Promise<void> {
  const exists = await prisma.esgProfile.findUnique({ where: { listingId }, select: { id: true } });
  if (!exists) {
    await prisma.esgProfile.create({
      data: {
        listingId,
        energyScore: null,
        carbonScore: null,
        sustainabilityScore: null,
        certification: null,
        solar: false,
        renovation: false,
        highCarbonMaterials: false,
      },
    });
  }
  await syncEsgScoreForListing(listingId);
  logInfo(`${TAG} ensure.stub`, { listingId });
}

export async function appendEsgEvent(
  listingId: string,
  input: { type: "IMPROVEMENT" | "RISK"; message: string; scoreImpact: number }
): Promise<void> {
  await prisma.esgEvent.create({
    data: {
      listingId,
      type: input.type,
      message: input.message,
      scoreImpact: input.scoreImpact,
    },
  });
  logInfo(`${TAG} event`, { listingId, type: input.type });
}

export async function getEsgDashboardBundle(listingId: string) {
  const profile = await prisma.esgProfile.findUnique({ where: { listingId } });
  if (!profile) return null;
  const payload = toPayload(profile);
  const engine = computeEsgScore(payload);
  const recommendations = buildEsgRecommendations(payload, engine.flags);
  const events = await prisma.esgEvent.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return { profile, engine, recommendations, events };
}

export async function getPublicEsgBadge(listingId: string): Promise<EsgBadgePayload | null> {
  const profile = await prisma.esgProfile.findUnique({ where: { listingId } });
  if (!profile?.grade || profile.compositeScore == null) return null;
  if (profile.compositeScore < ESG_PUBLIC_BADGE_MIN_SCORE) return null;
  const grade = profile.grade as EsgGrade;
  logInfo(`${TAG_SCORE} badge`, { listingId, grade });
  return {
    grade,
    score: profile.compositeScore,
    label: `🌱 ESG Score: ${grade}`,
  };
}

export async function userCanManageListingListing(userId: string, listingId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === PlatformRole.ADMIN) return true;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (listing?.ownerId && listing.ownerId === userId) return true;

  const access = await prisma.brokerListingAccess.findFirst({
    where: { listingId, brokerId: userId },
    select: { id: true },
  });
  return Boolean(access);
}

/** Fire-and-forget hook: refresh score after listing surfaced */
export async function touchEsgOnListingView(listingId: string): Promise<void> {
  try {
    await syncEsgScoreForListing(listingId);
  } catch {
    /* missing profile — ignore */
  }
}
