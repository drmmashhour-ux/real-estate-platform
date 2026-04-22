/**
 * Operational monitoring signals — NOT clinical diagnoses.
 * Derived from sensors, workflows, chats, and staff/family operational inputs.
 */
export type SoinsSignalType =
  | "MOVEMENT_MISSED"
  | "MISSED_MEAL"
  | "MISSED_MEDICATION"
  | "ABNORMAL_ACTIVITY"
  | "EMERGENCY_BUTTON"
  | "CHAT_DISTRESS_SIGNAL"
  | "CAMERA_INACTIVITY"
  | "FAMILY_CONCERN";

export type SoinsRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Rule-safe explanation line (operator / privacy aware). */
export type SoinsExplainabilityEntry = {
  ruleId: string;
  description: string;
};

export type SoinsAiAssessment = {
  residentId: string;
  riskLevel: SoinsRiskLevel;
  reasons: string[];
  recommendedActions: string[];
  explainability: SoinsExplainabilityEntry[];
  notifyFamily: boolean;
  notifyStaff: boolean;
  notifyAdmin: boolean;
};

/** Inputs for deterministic evaluation (counts = occurrences in evaluation window). */
export type SoinsRiskInput = {
  residentId: string;
  /** Typical window: last 24h — caller defines window; counts must match it. */
  signalCounts: Partial<Record<SoinsSignalType, number>>;
  /** From infrastructure: no healthy camera heartbeat / stream inactive */
  cameraInactive?: boolean;
  /** Escalated family-initiated operational concern (not medical). */
  familyConcernLevel?: "none" | "standard" | "elevated";
};

/** Lightweight payloads for dashboards & mobile — no PHI, operational wording only. */
export type SoinsFamilyRiskVm = {
  residentId: string;
  headline: string;
  riskLevel: SoinsRiskLevel;
  summaryLines: string[];
};

export type SoinsResidentDailyVm = {
  residentId: string;
  generatedAtIso: string;
  mealsOperationalStatus: string;
  activityOperationalStatus: string;
  alertsLast24h: number;
  communicationHighlight: string;
  cameraOperationalStatus: string;
  nextFollowUpRecommendation: string;
};

export type SoinsAdminPulseVm = {
  generatedAtIso: string;
  residentsMonitored: number;
  criticalOpenCount: number;
  highOpenCount: number;
  recentOperationalNotes: string[];
};

export type NotificationRoutingPlan = {
  residentId: string;
  assessmentRisk: SoinsRiskLevel;
  /** Family members for general operational alerts (receive alerts permission). */
  familyNotifyUserIds: string[];
  /** Family members eligible for camera-related operational notices. */
  familyCameraNotifyUserIds: string[];
  residenceOperatorUserId: string | null;
  notifyAdmin: boolean;
  suppressed: Array<{ audience: string; reason: string }>;
};
