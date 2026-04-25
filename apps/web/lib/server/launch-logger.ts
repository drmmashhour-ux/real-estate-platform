/**
 * Structured server logs for production — narrow tags only (no noisy printf debugging).
 */

import { redactForLog } from "@/lib/security/redact";
import { tryCaptureFromTaggedLog } from "@/modules/outcomes/outcome-log";

type Tag =
  | "[api]"
  | "[stripe]"
  | "[payment]"
  | "[booking]"
  | "[autopilot]"
  | "[compliance]"
  | "[compliance:oaciq]"
  | "[compliance:conflict]"
  | "[deal]"
  | "[lead]"
  | "[transaction]"
  | "[tax]"
  | "[playbook]"
  | "[finance-admin]"
  | "[investment-compliance]"
  | "[insurance]"
  | "[listing]"
  | "[ceo-memory]";

function emit(tag: Tag, level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>): void {
  const line = `${tag} ${msg}`;
  const safePayload = payload ? redactForLog(payload) : "";
  try {
    if (level === "info") console.info(line, safePayload ?? "");
    else if (level === "warn") console.warn(line, safePayload ?? "");
    else console.error(line, safePayload ?? "");
  } catch {
    /* never throw from logging */
  }
  try {
    if (payload && (level === "info" || level === "warn") && process.env.NEXT_RUNTIME !== "edge") {
      // Lazy load to avoid Prisma initialization in instrumentation
      import("@/modules/outcomes/outcome-log").then(m => {
        m.tryCaptureFromTaggedLog(tag, level, msg, payload);
      }).catch(() => {});
    }
  } catch (e) {
    console.error("[lecipm][outcome] tryCaptureFromTaggedLog failed", e instanceof Error ? e.message : e);
  }
}

export const logApi = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[api]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[api]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[api]", "error", msg, payload),
};

export const logStripeTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[stripe]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[stripe]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[stripe]", "error", msg, payload),
};

export const logPaymentTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[payment]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[payment]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[payment]", "error", msg, payload),
};

export const logBooking = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[booking]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[booking]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[booking]", "error", msg, payload),
};

export const logAutopilotTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[autopilot]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[autopilot]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[autopilot]", "error", msg, payload),
};

export const logComplianceTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[compliance]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[compliance]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[compliance]", "error", msg, payload),
};

/** OACIQ client disclosure audit line — use messages `disclosure_shown` | `disclosure_accepted`. */
export const logOaciqComplianceTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[compliance:oaciq]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[compliance:oaciq]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[compliance:oaciq]", "error", msg, payload),
};

/** OACIQ-oriented broker conflict / self-dealing — `conflict detected` | `consent accepted`. */
export const logConflictComplianceTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[compliance:conflict]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[compliance:conflict]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[compliance:conflict]", "error", msg, payload),
};

export const logDealTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[deal]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[deal]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[deal]", "error", msg, payload),
};

export const logLeadTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[lead]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[lead]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[lead]", "error", msg, payload),
};

export const logTransactionTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[transaction]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[transaction]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[transaction]", "error", msg, payload),
};

export const logTaxTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[tax]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[tax]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[tax]", "error", msg, payload),
};

export const logFinanceAdminTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[finance-admin]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[finance-admin]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[finance-admin]", "error", msg, payload),
};

export const logInvestmentComplianceTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[investment-compliance]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[investment-compliance]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[investment-compliance]", "error", msg, payload),
};

/** Broker professional liability (FARCIQ) — `validated` | `expired` | `uploaded` | `blocked`. */
export const logInsuranceTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[insurance]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[insurance]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[insurance]", "error", msg, payload),
};

/** CRM listing lifecycle — `created` | `prepared_for_centris` | `published` (Centris prep uses manual export only unless authorized). */
export const logListingTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[listing]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[listing]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[listing]", "error", msg, payload),
};

/** CEO decision memory + outcomes — `decision_recorded` | `outcome_recorded`. */
export const logCeoMemoryTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[ceo-memory]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[ceo-memory]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[ceo-memory]", "error", msg, payload),
};

/** Autonomous rollout — policy, execution, cohort, rollback observability. */
export const logRolloutTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[rollout]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[rollout]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[rollout]", "error", msg, payload),
};
