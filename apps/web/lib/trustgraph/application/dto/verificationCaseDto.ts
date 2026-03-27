import type {
  EntityVerificationLink,
  HumanReviewAction,
  NextBestAction,
  User,
  VerificationCase,
  VerificationRuleResult,
  VerificationSignal,
} from "@prisma/client";

export type VerificationCaseSummaryDto = {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  overallScore: number | null;
  trustLevel: string | null;
  readinessLevel: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  explanation: string | null;
  summary: Record<string, unknown> | null;
};

export function toVerificationCaseSummaryDto(c: VerificationCase): VerificationCaseSummaryDto {
  return {
    id: c.id,
    entityType: c.entityType,
    entityId: c.entityId,
    status: c.status,
    overallScore: c.overallScore,
    trustLevel: c.trustLevel,
    readinessLevel: c.readinessLevel,
    assignedTo: c.assignedTo,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    explanation: c.explanation,
    summary: (c.summary as Record<string, unknown> | null) ?? null,
  };
}

export type SignalDto = {
  id: string;
  signalCode: string;
  signalName: string;
  category: string;
  severity: string;
  status: string;
  message: string | null;
  evidence: unknown;
  createdAt: string;
};

export type RuleResultDto = {
  id: string;
  ruleCode: string;
  ruleVersion: string;
  passed: boolean;
  scoreDelta: number;
  confidence: number | null;
  details: unknown;
  createdAt: string;
};

export type NextBestActionDto = {
  id: string;
  actionCode: string;
  title: string;
  description: string;
  priority: string;
  actorType: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
};

export type ReviewActionDto = {
  id: string;
  actionType: string;
  notes: string | null;
  payload: unknown;
  createdAt: string;
  reviewer: { id: string; email: string | null };
};

export type EntityLinkDto = {
  id: string;
  linkedEntityType: string;
  linkedEntityId: string;
  relationType: string;
};

export type VerificationCaseDetailDto = VerificationCaseSummaryDto & {
  scoreBreakdown: unknown;
  resolvedAt: string | null;
  createdBy: string | null;
  signals: SignalDto[];
  ruleResults: RuleResultDto[];
  nextBestActions: NextBestActionDto[];
  reviewActions: ReviewActionDto[];
  linkedEntities: EntityLinkDto[];
};

export function toVerificationCaseDetailDto(args: {
  case: VerificationCase;
  signals: VerificationSignal[];
  ruleResults: VerificationRuleResult[];
  nextBestActions: NextBestAction[];
  reviewActions: (HumanReviewAction & { reviewer: Pick<User, "id" | "email"> })[];
  links: EntityVerificationLink[];
}): VerificationCaseDetailDto {
  const c = args.case;
  return {
    ...toVerificationCaseSummaryDto(c),
    scoreBreakdown: c.scoreBreakdown,
    resolvedAt: c.resolvedAt?.toISOString() ?? null,
    createdBy: c.createdBy,
    signals: args.signals.map((s) => ({
      id: s.id,
      signalCode: s.signalCode,
      signalName: s.signalName,
      category: s.category,
      severity: s.severity,
      status: s.status,
      message: s.message,
      evidence: s.evidence,
      createdAt: s.createdAt.toISOString(),
    })),
    ruleResults: args.ruleResults.map((r) => ({
      id: r.id,
      ruleCode: r.ruleCode,
      ruleVersion: r.ruleVersion,
      passed: r.passed,
      scoreDelta: r.scoreDelta,
      confidence: r.confidence ? Number(r.confidence) : null,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
    })),
    nextBestActions: args.nextBestActions.map((a) => ({
      id: a.id,
      actionCode: a.actionCode,
      title: a.title,
      description: a.description,
      priority: a.priority,
      actorType: a.actorType,
      status: a.status,
      dueAt: a.dueAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    reviewActions: args.reviewActions.map((h) => ({
      id: h.id,
      actionType: h.actionType,
      notes: h.notes,
      payload: h.payload,
      createdAt: h.createdAt.toISOString(),
      reviewer: { id: h.reviewerId, email: h.reviewer.email },
    })),
    linkedEntities: args.links.map((l) => ({
      id: l.id,
      linkedEntityType: l.linkedEntityType,
      linkedEntityId: l.linkedEntityId,
      relationType: l.relationType,
    })),
  };
}
