import type { TrustProfile } from "@prisma/client";

/** Admin-safe trust profile (numeric scores are internal but allowed for staff tooling). */
export type TrustProfileDto = {
  subjectType: string;
  subjectId: string;
  trustScore: number;
  fraudScore: number;
  completionScore: number;
  qualityScore: number;
  legalScore: number;
  lastCaseId: string | null;
  updatedAt: string;
};

export function toTrustProfileDto(row: TrustProfile): TrustProfileDto {
  return {
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    trustScore: row.trustScore,
    fraudScore: row.fraudScore,
    completionScore: row.completionScore,
    qualityScore: row.qualityScore,
    legalScore: row.legalScore,
    lastCaseId: row.lastCaseId,
    updatedAt: row.updatedAt.toISOString(),
  };
}
