/**
 * CRITICAL notices requiring explicit server-side acknowledgment before signature.
 * IDs are stable contract keys — UI must submit checkbox per notice.
 */
export const LECIPM_CRITICAL_NOTICE_IDS = [
  "CRITICAL_EXECUTION_NOT_OACIQ_PUBLISHER",
  "CRITICAL_BROKER_LEGAL_RESPONSIBILITY",
  "CRITICAL_CLIENT_DUTY_OF_DISCLOSURE",
] as const;

export type LecipmCriticalNoticeId = (typeof LECIPM_CRITICAL_NOTICE_IDS)[number];

export function isCriticalNoticeId(id: string): id is LecipmCriticalNoticeId {
  return (LECIPM_CRITICAL_NOTICE_IDS as readonly string[]).includes(id);
}
