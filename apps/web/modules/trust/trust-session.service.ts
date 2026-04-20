import { legalHubFlags, trustFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildLegalHubContextFromDb } from "@/modules/legal/legal-context.service";
import { buildLegalHubSummary } from "@/modules/legal/legal-state.service";
import { computeLegalReadinessScore } from "@/modules/legal/legal-readiness.service";
import type { LegalHubActorType } from "@/modules/legal/legal.types";
import { buildPublicTrustPayload } from "./trust-public";
import type { PublicTrustPayload } from "./trust.types";

function daysSince(d: Date): number {
  return Math.max(0, (Date.now() - d.getTime()) / 86400000);
}

function personaFromActor(a: LegalHubActorType): "buyer" | "seller" | "broker" | "host" {
  if (a === "buyer") return "buyer";
  if (a === "broker") return "broker";
  if (a === "host") return "host";
  return "seller";
}

/**
 * Full trust snapshot for the signed-in account (Legal Hub + verification when flags allow).
 * Safe — no throws.
 */
export async function loadTrustPayloadForSessionUser(params: {
  userId: string;
  locale?: string;
  country?: string;
  actorHint?: string | null;
}): Promise<PublicTrustPayload | null> {
  try {
    if (!trustFlags.trustScoringV1 && !trustFlags.trustBadgesV1) return null;

    const u = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        createdAt: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        stripeOnboardingComplete: true,
        brokerVerifications: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { verificationStatus: true },
        },
      },
    });
    if (!u) return null;

    let legalSummary = null as ReturnType<typeof buildLegalHubSummary> | null;
    let readiness = null as ReturnType<typeof computeLegalReadinessScore> | null;

    const locale = params.locale ?? "en";
    const country = (params.country ?? "ca").toLowerCase();

    if (legalHubFlags.legalHubV1) {
      try {
        const ctx = await buildLegalHubContextFromDb({
          userId: params.userId,
          locale,
          country,
          actorHint: params.actorHint ?? undefined,
          jurisdictionHint: country === "ca" ? "QC" : null,
        });
        legalSummary = buildLegalHubSummary(ctx);
        readiness = legalHubFlags.legalReadinessV1 ? computeLegalReadinessScore(legalSummary) : null;
      } catch {
        legalSummary = null;
        readiness = null;
      }
    }

    if (
      legalIntelligenceFlags.legalIntelligenceV1 &&
      legalSummary &&
      legalHubFlags.legalHubV1
    ) {
      try {
        const { getLegalIntelligenceBundle } = await import("@/modules/legal/legal-intelligence.service");
        const bundle = await getLegalIntelligenceBundle({
          entityType: "user_scope",
          entityId: params.userId,
          actorType: legalSummary.actorType,
          workflowType: "seller_disclosure",
        });
        intelligenceSummary = bundle.summary;
      } catch {
        intelligenceSummary = null;
      }
    }

    const badgeContext = legalSummary
      ? {
          persona: personaFromActor(legalSummary.actorType),
          legalReadiness: readiness?.score ?? null,
          emailVerified: u.emailVerifiedAt != null,
          phoneVerified: u.phoneVerifiedAt != null,
          stripeOnboardingComplete: u.stripeOnboardingComplete === true,
          brokerLicenseVerified: u.brokerVerifications[0]?.verificationStatus === "VERIFIED",
        }
      : {
          persona: "seller" as const,
          legalReadiness: readiness?.score ?? null,
          emailVerified: u.emailVerifiedAt != null,
          phoneVerified: u.phoneVerifiedAt != null,
          stripeOnboardingComplete: u.stripeOnboardingComplete === true,
          brokerLicenseVerified: u.brokerVerifications[0]?.verificationStatus === "VERIFIED",
        };

    return buildPublicTrustPayload({
      legalReadinessScore: readiness ?? undefined,
      legalSummary,
      accountAgeDays: daysSince(u.createdAt),
      verificationFlags: {
        emailVerified: u.emailVerifiedAt != null,
        phoneVerified: u.phoneVerifiedAt != null,
        stripeOnboardingComplete: u.stripeOnboardingComplete === true,
        brokerLicenseVerified: u.brokerVerifications[0]?.verificationStatus === "VERIFIED",
      },
      badgeContext,
      includeBadges: trustFlags.trustBadgesV1,
    });
  } catch {
    return null;
  }
}
