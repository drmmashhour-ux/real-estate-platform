import { logInfo } from "@/lib/logger";

const TAG = "[investor-memo]";

/**
 * Call from ESG, acquisition, optimizer, or retrofit paths when structured inputs materially change.
 * Current behavior: audit log only — consumers may later auto-queue regeneration jobs.
 */
export function recordInvestorArtifactStaleSignal(listingId: string, reasons: string[]): void {
  logInfo(`${TAG} automation-signal`, { listingId, reasons });
}
