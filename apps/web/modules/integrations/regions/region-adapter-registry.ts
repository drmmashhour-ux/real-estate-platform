/**
 * Registered regional adapters — deterministic; extend by updating ADAPTER_BY_CODE only.
 */
import type { PlatformRegionCode } from "@lecipm/platform-core";
import { webRegionAdapter } from "./web-region-adapter.service";
import { syriaPlatformRegionAdapter } from "./syria-region-adapter.service";

export const REGION_SY = "sy" as const;
export const REGION_CA_QC = "ca_qc" as const;

export type RegisteredRegionCode = PlatformRegionCode | (string & {});

export type RegionAdapterBundle = {
  regionCode: RegisteredRegionCode;
  adapter:
    | typeof webRegionAdapter
    | typeof syriaPlatformRegionAdapter
    | null;
};

function normCode(regionCode: string): string {
  const raw = typeof regionCode === "string" ? regionCode.trim().toLowerCase() : "";
  if (raw === "syria") return REGION_SY;
  if (raw === "qc" || raw === "quebec") return REGION_CA_QC;
  return raw;
}

const ADAPTER_BY_CODE: Record<string, RegionAdapterBundle["adapter"]> = {
  [REGION_CA_QC]: webRegionAdapter,
  [REGION_SY]: syriaPlatformRegionAdapter,
};

function compareRegionCodes(a: string, b: string): number {
  return a.localeCompare(b, "en");
}

/** Deterministic ordering for UI / APIs. */
export function listRegisteredRegionCodes(): RegisteredRegionCode[] {
  return Object.keys(ADAPTER_BY_CODE).sort(compareRegionCodes) as RegisteredRegionCode[];
}

export function listAvailableRegionAdapters(): RegionAdapterBundle[] {
  return listRegisteredRegionCodes().map((code) => ({
    regionCode: code,
    adapter: ADAPTER_BY_CODE[normCode(code)] ?? null,
  }));
}

/**
 * Primary lookup — returns adapter + code (safe null when unknown).
 */
export function getRegionAdapter(regionCode: string): RegionAdapterBundle | null {
  const code = normCode(regionCode);
  if (!code) return null;
  const adapter = ADAPTER_BY_CODE[code] ?? null;
  if (!adapter) return null;
  return { regionCode: code as RegisteredRegionCode, adapter };
}

/** @deprecated Use `getRegionAdapter` — kept for existing API routes. */
export function getRegionBundle(regionCode: string): RegionAdapterBundle | null {
  return getRegionAdapter(regionCode);
}
