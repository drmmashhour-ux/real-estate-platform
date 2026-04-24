import type { AutopilotPlanContext } from "./types";

type DraftLike = {
  status: string;
  alerts: { severity: string; title: string; alertType?: string }[];
};

export function buildLayerContextFromLegalDraft(
  draft: DraftLike,
  userId: string,
  role: string,
  draftId: string
): AutopilotPlanContext {
  const blocking = draft.alerts.some((a) => a.severity === "blocking");
  const high = draft.alerts.some((a) => a.severity === "high" || a.severity === "blocking");

  return {
    userId,
    draftId,
    role,
    turboDraftStatus: draft.status,
    noticesComplete: !blocking,
    contractBrainGate: blocking ? "blocked" : "ok",
    turboDraftCanProceed: !blocking,
    aiCriticalFindings: blocking,
    aiFindingsSummary: draft.alerts.find((a) => a.severity === "blocking")?.title ?? null,
    paymentStatus: draft.status === "ready" ? "UNPAID" : "N_A",
    representedStatus: null,
    risks: draft.alerts.map((a) => ({
      code: a.alertType,
      severity: a.severity,
      message: a.title,
    })),
    transactionType: "legal_form",
  };
}
