import type { LecipmNoShowRiskBand } from "@prisma/client";

/**
 * Centralized, typed defaults for the LECIPM no-show engine.
 * Tuning via env; fallbacks are conservative to avoid over-messaging.
 */
export const NOSHOW_CONFIG = {
  /** Hours before appt: send 24h reminder. */
  reminderH24: Number(process.env.LECIPM_NSHOW_REMINDER_H24 ?? 24),
  /** Hours before appt: send 3h reminder. */
  reminderH3: Number(process.env.LECIPM_NSHOW_REMINDER_H3 ?? 3),
  /** Minutes before appt: high-value 30m nudge. */
  reminderM30: Number(process.env.LECIPM_NSHOW_REMINDER_M30 ?? 30),
  /** Score at/above = HIGH band. */
  riskHigh: Number(process.env.LECIPM_NSHOW_RISK_HIGH ?? 70),
  /** Score at/above = MEDIUM. */
  riskMedium: Number(process.env.LECIPM_NSHOW_RISK_MED ?? 40),
  /** Min minutes between any two reminders to same visit (anti-spam). */
  minMinutesBetweenReminders: Number(process.env.LECIPM_NSHOW_MIN_MINUTES_BETWEEN ?? 60),
  /** Estimated deal value (same units as `Lead.estimatedValue`, typically CAD dollars) at/above: allow optional 30m reminder. */
  highValueLeadMin: Number(process.env.LECIPM_NSHOW_HIGH_VALUE_LEAD_MIN ?? 800_000),
  maxRemindersPerVisit: 6,
} as const;

export function bandForScore(score: number): LecipmNoShowRiskBand {
  if (score >= NOSHOW_CONFIG.riskHigh) return "HIGH";
  if (score >= NOSHOW_CONFIG.riskMedium) return "MEDIUM";
  return "LOW";
}

/** Reminder channel priority when multiple allowed. */
export const NOSHOW_CHANNEL_ORDER = ["in_app", "email", "sms"] as const;
