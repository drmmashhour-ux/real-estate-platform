/**
 * Central entry for durable security-related rows (`platform_events`) + stdout JSON (`logSecurityEvent`).
 * Search: admin API or Prisma; long-term: drain Vercel logs to your SIEM.
 */
export { getPlatformEvents, recordPlatformEvent } from "@/lib/observability";
export { logSecurityEvent } from "@/lib/security/security-events";
