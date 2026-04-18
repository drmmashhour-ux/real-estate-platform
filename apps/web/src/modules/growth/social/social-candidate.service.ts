import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { GROWTH_V2 } from "../growth-v2.constants";
import { selectListingImagesForSocial } from "./social-asset-selector.service";
import { buildCaptionPackages } from "./social-caption.service";

function scoreSocialCandidate(input: {
  imageCount: number;
  priceCents: number;
  city: string;
}): { socialCandidateScore: number; scoresJson: Record<string, number> } {
  const visualStrength = Math.min(1, input.imageCount / 10);
  const uniqueness = 0.5;
  const engagementPotential = 0.45 + 0.2 * visualStrength;
  const businessPriority = input.priceCents > 0 ? 0.55 : 0.35;
  const freshness = 0.5;
  const audienceFit = 0.5;
  const socialCandidateScore =
    100 *
    Math.min(
      1,
      visualStrength * 0.22 +
        uniqueness * 0.12 +
        engagementPotential * 0.2 +
        businessPriority * 0.18 +
        freshness * 0.14 +
        audienceFit * 0.14
    );
  return {
    socialCandidateScore,
    scoresJson: {
      visualStrengthScore: Math.round(100 * visualStrength),
      uniquenessScore: Math.round(100 * uniqueness),
      engagementPotentialScore: Math.round(100 * engagementPotential),
      businessPriorityScore: Math.round(100 * businessPriority),
      freshnessScore: Math.round(100 * freshness),
      audienceFitScore: Math.round(100 * audienceFit),
    },
  };
}

/**
 * Creates review-only social packages — never posts.
 */
export async function scanSocialContentCandidatesV2(limit = 40): Promise<{ created: number }> {
  if (!engineFlags.growthV2 || !engineFlags.socialContentAutopilotV2) return { created: 0 };

  const listings = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    orderBy: { updatedAt: "desc" },
    take: GROWTH_V2.MAX_SOCIAL_CANDIDATES_PER_RUN,
    select: {
      id: true,
      title: true,
      city: true,
      priceCents: true,
      coverImage: true,
      images: true,
    },
  });

  let created = 0;
  for (const l of listings) {
    const imgs = Array.isArray(l.images) ? l.images : [];
    const imageCount = imgs.length;
    if (imageCount < GROWTH_V2.MIN_PHOTOS_FOR_SOCIAL) continue;

    const assets = selectListingImagesForSocial({ cover: l.coverImage, images: imgs });
    const { socialCandidateScore, scoresJson } = scoreSocialCandidate({
      imageCount,
      priceCents: l.priceCents,
      city: l.city,
    });
    if (socialCandidateScore < 52) continue;

    const path = `/listings/${l.id}`;
    const priceLabel = `${Math.round(l.priceCents / 100).toLocaleString()} CAD`;
    const packages = buildCaptionPackages({
      city: l.city,
      priceLabel,
      listingTitle: l.title,
      path,
    });

    const dup = await prisma.socialContentCandidate.findFirst({
      where: { targetType: "fsbo_listing", targetId: l.id, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    });
    if (dup) continue;

    await prisma.socialContentCandidate.create({
      data: {
        targetType: "fsbo_listing",
        targetId: l.id,
        status: "ready_for_review",
        socialCandidateScore,
        scoresJson,
        contentPackageJson: { assets, packages },
        complianceNotes: "Auto-generated package — human review required before publish.",
      },
    });
    created++;
    if (created >= limit) break;
  }

  return { created };
}
