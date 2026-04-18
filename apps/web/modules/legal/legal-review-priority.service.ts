import type {
  LegalIntelligenceSummary,
  LegalQueueItemScore,
  LegalReviewPriorityLevel,
  LegalReviewPriorityScore,
  LegalReviewQueueItemInput,
} from "./legal-intelligence.types";

type PriorityParams = {
  criticalSignalCount: number;
  warningSignalCount: number;
  missingCriticalRequirements: number;
  priorRejections: number;
  submissionAgeHours: number;
  workflowSensitivity: "low" | "medium" | "high";
  readinessScore?: number;
  enforcementBlocking?: boolean;
  downstreamBlocked?: boolean;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function priorityLevelRank(l: LegalReviewPriorityLevel): number {
  if (l === "urgent") return 4;
  if (l === "high") return 3;
  if (l === "normal") return 2;
  return 1;
}

export function computeLegalReviewPriorityScore(params: PriorityParams): LegalReviewPriorityScore {
  let score = 40;
  const reasons: string[] = [];

  score += params.criticalSignalCount * 22;
  if (params.criticalSignalCount > 0) {
    reasons.push(`${params.criticalSignalCount} critical advisory signal(s) present`);
  }

  score += params.warningSignalCount * 10;
  if (params.warningSignalCount > 0) {
    reasons.push(`${params.warningSignalCount} warning-level advisory signal(s) present`);
  }

  score += clamp(params.missingCriticalRequirements, 0, 6) * 12;
  if (params.missingCriticalRequirements > 0) {
    reasons.push(`${params.missingCriticalRequirements} critical requirement gap(s)`);
  }

  score += clamp(params.priorRejections, 0, 12) * 5;
  if (params.priorRejections > 0) {
    reasons.push(`${params.priorRejections} prior rejection(s) in metadata window`);
  }

  if (params.submissionAgeHours >= 72) {
    score += 18;
    reasons.push(`Submission aging ${Math.round(params.submissionAgeHours)}h — review SLA risk`);
  } else if (params.submissionAgeHours >= 24) {
    score += 8;
    reasons.push(`Submission aging ${Math.round(params.submissionAgeHours)}h`);
  }

  if (params.workflowSensitivity === "high") {
    score += 14;
    reasons.push("High-sensitivity workflow");
  } else if (params.workflowSensitivity === "medium") {
    score += 6;
    reasons.push("Medium-sensitivity workflow");
  }

  if (typeof params.readinessScore === "number") {
    if (params.readinessScore < 40) {
      score += 12;
      reasons.push("Low readiness score");
    } else if (params.readinessScore < 65) {
      score += 5;
      reasons.push("Below-target readiness score");
    }
  }

  if (params.enforcementBlocking) {
    score += 25;
    reasons.push("Enforcement gate blocking progression");
  }

  if (params.downstreamBlocked) {
    score += 20;
    reasons.push("Downstream listing/booking action blocked pending review");
  }

  score = clamp(Math.round(score), 0, 100);

  let level: LegalReviewPriorityLevel = "normal";
  const urgentSignals =
    params.criticalSignalCount >= 2 ||
    (params.enforcementBlocking === true && params.submissionAgeHours >= 48) ||
    (params.downstreamBlocked === true && params.submissionAgeHours >= 24 && params.criticalSignalCount >= 1);

  if (urgentSignals || score >= 82) {
    level = "urgent";
    if (!reasons.length) reasons.push("Escalated priority band — capacity / aging / blocking gates");
  } else if (score >= 62 || params.warningSignalCount >= 3 || params.priorRejections >= 4) {
    level = "high";
  } else if (score <= 34 && params.criticalSignalCount === 0 && params.warningSignalCount <= 1) {
    level = "low";
  }

  return { score, level, reasons: reasons.slice(0, 12) };
}

export function scoreLegalQueueItem(
  item: LegalReviewQueueItemInput,
  intelligenceSummary: LegalIntelligenceSummary | null | undefined,
): LegalQueueItemScore {
  const now = Date.now();
  const submitted = Date.parse(item.submittedAt);
  const submissionAgeHours = Number.isNaN(submitted) ? 0 : (now - submitted) / 3600000;

  const fromSummary = intelligenceSummary
    ? {
        critical: intelligenceSummary.countsBySeverity.critical,
        warning: intelligenceSummary.countsBySeverity.warning,
      }
    : { critical: 0, warning: 0 };

  const prio = computeLegalReviewPriorityScore({
    criticalSignalCount: item.criticalSignals ?? fromSummary.critical,
    warningSignalCount: item.warningSignals ?? fromSummary.warning,
    missingCriticalRequirements: item.missingCriticalRequirements ?? 0,
    priorRejections: item.priorRejections ?? 0,
    submissionAgeHours,
    workflowSensitivity: item.workflowSensitivity ?? "medium",
    readinessScore: item.readinessScore,
    enforcementBlocking: item.enforcementBlocking,
    downstreamBlocked: item.downstreamBlocked,
  });

  return {
    itemId: item.id,
    entityType: item.entityType,
    entityId: item.entityId,
    label: item.label,
    score: prio.score,
    level: prio.level,
    reasons: prio.reasons,
    submittedAt: item.submittedAt,
  };
}

export function prioritizeLegalReviewQueue(
  items: LegalReviewQueueItemInput[],
  intelligenceSummary: LegalIntelligenceSummary | null | undefined,
): LegalQueueItemScore[] {
  const scored = items.map((item) => scoreLegalQueueItem(item, intelligenceSummary));
  return [...scored].sort((a, b) => {
    const lr = priorityLevelRank(b.level) - priorityLevelRank(a.level);
    if (lr !== 0) return lr;
    if (b.score !== a.score) return b.score - a.score;
    return Date.parse(b.submittedAt) - Date.parse(a.submittedAt);
  });
}
