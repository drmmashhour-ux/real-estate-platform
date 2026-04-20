import type { ComplianceStatusPayload } from "@/services/compliance/coownershipCompliance.service";
import { getMergedComplianceStatus } from "@/services/compliance/coownershipCompliance.service";

type Entry = { expires: number; value: ComplianceStatusPayload };

const TTL_MS = 45_000;
const store = new Map<string, Entry>();

export async function getCachedComplianceStatus(listingId: string): Promise<ComplianceStatusPayload> {
  const now = Date.now();
  const hit = store.get(listingId);
  if (hit && hit.expires > now) return hit.value;

  const value = await getMergedComplianceStatus(listingId);
  store.set(listingId, { expires: now + TTL_MS, value });
  return value;
}

export function invalidateComplianceStatusCache(listingId: string): void {
  store.delete(listingId);
}
