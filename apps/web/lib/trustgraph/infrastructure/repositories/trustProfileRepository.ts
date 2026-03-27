import type { Prisma } from "@prisma/client";
import type { ReadinessLevel, TrustLevel } from "@prisma/client";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

type UpsertListingArgs = {
  listingId: string;
  caseId: string;
  overallScore: number;
  trustLevel: TrustLevel;
  readinessLevel: ReadinessLevel;
  results: RuleEvaluationResult[];
};

type UpsertBrokerArgs = {
  userId: string;
  caseId: string;
  overallScore: number;
  trustLevel: TrustLevel;
  readinessLevel: ReadinessLevel;
  results: RuleEvaluationResult[];
};

type UpsertHostArgs = {
  hostId: string;
  caseId: string;
  overallScore: number;
  trustLevel: TrustLevel;
  readinessLevel: ReadinessLevel;
  results: RuleEvaluationResult[];
};

function legalScoreFromDeclarationRules(results: RuleEvaluationResult[]): number {
  const mandatory = results.find((r) => r.ruleCode === "DECLARATION_MANDATORY_FIELDS_RULE");
  const sections = results.find((r) => r.ruleCode === "DECLARATION_REQUIRED_SECTIONS_RULE");
  if (mandatory?.passed && sections?.passed) return 80;
  if (mandatory?.passed || sections?.passed) return 55;
  return 40;
}

export const trustProfileRepository = {
  async upsertForFsboListing(tx: Prisma.TransactionClient, args: UpsertListingArgs) {
    const { listingId, caseId, overallScore, trustLevel, readinessLevel, results } = args;
    const legalScore = legalScoreFromDeclarationRules(results);

    await tx.trustProfile.upsert({
      where: {
        subjectType_subjectId: { subjectType: "listing", subjectId: listingId },
      },
      create: {
        subjectType: "listing",
        subjectId: listingId,
        trustScore: overallScore,
        fraudScore: Math.max(0, 100 - overallScore),
        completionScore: readinessLevel === "ready" ? 90 : readinessLevel === "partial" ? 60 : 30,
        qualityScore: trustLevel === "verified" || trustLevel === "high" ? 85 : 50,
        legalScore,
        lastCaseId: caseId,
        badges: [] as Prisma.InputJsonValue,
      },
      update: {
        trustScore: overallScore,
        fraudScore: Math.max(0, 100 - overallScore),
        completionScore: readinessLevel === "ready" ? 90 : readinessLevel === "partial" ? 60 : 30,
        qualityScore: trustLevel === "verified" || trustLevel === "high" ? 85 : 50,
        legalScore,
        lastCaseId: caseId,
      },
    });
  },

  async upsertForBrokerUser(tx: Prisma.TransactionClient, args: UpsertBrokerArgs) {
    const { userId, caseId, overallScore, trustLevel, readinessLevel, results } = args;
    const licenseOk = results.find((r) => r.ruleCode === "BROKER_LICENSE_PRESENT_RULE")?.passed ?? false;

    await tx.trustProfile.upsert({
      where: {
        subjectType_subjectId: { subjectType: "broker", subjectId: userId },
      },
      create: {
        subjectType: "broker",
        subjectId: userId,
        trustScore: overallScore,
        fraudScore: Math.max(0, 100 - overallScore),
        completionScore: readinessLevel === "ready" ? 90 : readinessLevel === "partial" ? 60 : 30,
        qualityScore: trustLevel === "verified" || trustLevel === "high" ? 85 : 50,
        legalScore: licenseOk ? 80 : 40,
        lastCaseId: caseId,
        badges: [] as Prisma.InputJsonValue,
      },
      update: {
        trustScore: overallScore,
        fraudScore: Math.max(0, 100 - overallScore),
        completionScore: readinessLevel === "ready" ? 90 : readinessLevel === "partial" ? 60 : 30,
        qualityScore: trustLevel === "verified" || trustLevel === "high" ? 85 : 50,
        legalScore: licenseOk ? 80 : 40,
        lastCaseId: caseId,
      },
    });
  },

  async upsertForBnhubHost(tx: Prisma.TransactionClient, args: UpsertHostArgs) {
    const { hostId, caseId, overallScore, trustLevel, readinessLevel } = args;
    await tx.trustProfile.upsert({
      where: {
        subjectType_subjectId: { subjectType: "host", subjectId: hostId },
      },
      create: {
        subjectType: "host",
        subjectId: hostId,
        trustScore: overallScore,
        fraudScore: Math.max(0, 100 - overallScore),
        completionScore: readinessLevel === "ready" ? 90 : readinessLevel === "partial" ? 60 : 30,
        qualityScore: trustLevel === "verified" || trustLevel === "high" ? 85 : 50,
        legalScore: 50,
        lastCaseId: caseId,
        badges: [] as Prisma.InputJsonValue,
      },
      update: {
        trustScore: overallScore,
        fraudScore: Math.max(0, 100 - overallScore),
        completionScore: readinessLevel === "ready" ? 90 : readinessLevel === "partial" ? 60 : 30,
        qualityScore: trustLevel === "verified" || trustLevel === "high" ? 85 : 50,
        lastCaseId: caseId,
      },
    });
  },

  async upsertForGuestUser(tx: Prisma.TransactionClient, args: UpsertBrokerArgs) {
    const { userId, caseId, overallScore, trustLevel, readinessLevel } = args;
    await tx.trustProfile.upsert({
      where: {
        subjectType_subjectId: { subjectType: "user", subjectId: userId },
      },
      create: {
        subjectType: "user",
        subjectId: userId,
        trustScore: overallScore,
        fraudScore: Math.max(0, 100 - overallScore),
        completionScore: readinessLevel === "ready" ? 90 : readinessLevel === "partial" ? 60 : 30,
        qualityScore: trustLevel === "verified" || trustLevel === "high" ? 85 : 50,
        legalScore: 50,
        lastCaseId: caseId,
        badges: [] as Prisma.InputJsonValue,
      },
      update: {
        trustScore: overallScore,
        fraudScore: Math.max(0, 100 - overallScore),
        completionScore: readinessLevel === "ready" ? 90 : readinessLevel === "partial" ? 60 : 30,
        qualityScore: trustLevel === "verified" || trustLevel === "high" ? 85 : 50,
        lastCaseId: caseId,
      },
    });
  },
};
