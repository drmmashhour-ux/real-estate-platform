/**
 * Registered regional read adapters — extend with new regions without coupling app code.
 */
import { syriaRegionAdapter } from "./syria/syria-region-adapter.service";

export const REGION_SY = "sy" as const;

export type RegisteredRegionCode = typeof REGION_SY | (string & {});

export type RegionBundle = {
  regionCode: RegisteredRegionCode;
  adapter: typeof syriaRegionAdapter | null;
};

function compareRegionCodes(a: string, b: string): number {
  return a.localeCompare(b, "en");
}

/** Deterministic ordering for UI / APIs. */
export function listRegisteredRegionCodes(): RegisteredRegionCode[] {
  return [REGION_SY].sort(compareRegionCodes);
}

/** Safe lookup — unsupported codes return null (callers degrade gracefully). */
export function getRegionBundle(regionCode: string): RegionBundle | null {
  const raw = typeof regionCode === "string" ? regionCode.trim().toLowerCase() : "";
  const code = raw === "syria" ? REGION_SY : raw;
  if (!code) return null;
  if (code === REGION_SY) {
    return { regionCode: REGION_SY, adapter: syriaRegionAdapter };
  }
  return null;
}
