import type { ClientIntakeProfile, RequiredDocumentItem } from "@prisma/client";
import { calculateChecklistProgress } from "@/modules/intake/services/calculate-checklist-progress";

export type IntakeReadinessSummary = {
  headline: string;
  detail: string;
  intakeStatus: ClientIntakeProfile["status"];
  mandatoryMissingCount: number;
  pendingReviewCount: number;
  percentComplete: number;
};

/**
 * Short copy for CRM, offers, and dashboards — non-blocking readiness signal.
 */
export function buildIntakeReadinessSummary(
  profile: Pick<ClientIntakeProfile, "status"> | null,
  items: Pick<RequiredDocumentItem, "isMandatory" | "status" | "deletedAt">[]
): IntakeReadinessSummary {
  if (!profile) {
    return {
      headline: "Intake not started",
      detail: "No intake profile yet.",
      intakeStatus: "NOT_STARTED",
      mandatoryMissingCount: 0,
      pendingReviewCount: 0,
      percentComplete: 0,
    };
  }

  const progress = calculateChecklistProgress(items);
  const active = items.filter((i) => i.deletedAt == null);
  const mandatoryMissing = active.filter(
    (i) =>
      i.isMandatory &&
      i.status !== "APPROVED" &&
      i.status !== "WAIVED"
  ).length;
  const pendingReview = active.filter(
    (i) => i.status === "UPLOADED" || i.status === "UNDER_REVIEW"
  ).length;

  let headline: string;
  let detail: string;

  switch (profile.status) {
    case "COMPLETE":
      headline = "Client intake complete";
      detail = "Required checklist items are satisfied.";
      break;
    case "UNDER_REVIEW":
      headline = "Intake under review";
      detail = "Awaiting broker review of submitted documents.";
      break;
    case "ON_HOLD":
      headline = "Intake on hold";
      detail = "Progress is paused until further notice.";
      break;
    case "NOT_STARTED":
      headline = "Intake not started";
      detail =
        mandatoryMissing > 0
          ? `${mandatoryMissing} mandatory item(s) still required.`
          : "Complete intake to continue.";
      break;
    default:
      headline =
        mandatoryMissing > 0
          ? `Incomplete: ${mandatoryMissing} mandatory document(s) missing`
          : "Intake in progress";
      detail =
        pendingReview > 0
          ? `${pendingReview} item(s) awaiting review.`
          : "Continue uploading requested documents.";
  }

  return {
    headline,
    detail,
    intakeStatus: profile.status,
    mandatoryMissingCount: mandatoryMissing,
    pendingReviewCount: pendingReview,
    percentComplete: progress.percentComplete,
  };
}
