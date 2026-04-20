/**
 * LECIPM automation / AI assist type system.
 * Clear separation: recommendations and drafts never imply execution.
 */

export type AutomationHubId =
  | "lecipm_crm"
  | "bnhub_host"
  | "investor"
  | "admin"
  | "growth"
  | "messaging";

export type RiskTier = "low" | "medium" | "high";

export type ActionClass = "recommendation" | "draft" | "approval_required" | "auto_safe";

export type ReasonCode = {
  code: string;
  message: string;
};

export type AutomationLogEntry = {
  at: string;
  kind: string;
  hub: AutomationHubId;
  actionClass: ActionClass;
  reasonCodes: ReasonCode[];
  /** No PII in freeform text; use references. */
  detail?: string;
};

export type SafeResult<T> =
  | { ok: true; data: T; log?: AutomationLogEntry }
  | { ok: false; error: string; code: string; log?: AutomationLogEntry };

export type AutomationEventPayload = {
  id: string;
  name: string;
  source: "prisma" | "api" | "cron" | "manual";
  /** JSON-serializable context; no secrets. */
  context: Record<string, string | number | boolean | null>;
};

export type AutomationEvent = {
  type: string;
  payload: AutomationEventPayload;
  receivedAt: string;
};

export type PolicyContext = {
  hub: AutomationHubId;
  actionClass: ActionClass;
  risk: RiskTier;
  featureKey: string;
};
