import { createHash } from "node:crypto";
import { normalizeSharedContext } from "./shared-context-normalize";
import type { SharedContextRepresentation } from "./shared-context.types";

/**
 * Stable string signature of normalized feature map (hex sha256, lowercase).
 */
export function buildSharedSignature(ctx: Record<string, string | number | boolean | null> | SharedContextRepresentation): string {
  try {
    const raw =
      "version" in ctx
        ? {
            o: (ctx as SharedContextRepresentation).originDomain,
            f: normalizeSharedContext((ctx as SharedContextRepresentation).features),
            e: (ctx as SharedContextRepresentation).explicitPreferences
              ? normalizeSharedContext((ctx as SharedContextRepresentation).explicitPreferences)
              : {},
          }
        : { f: normalizeSharedContext(ctx) };
    const stable = JSON.stringify(
      (function sortDeep(v: unknown): unknown {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          return Object.keys(v)
            .sort()
            .reduce<Record<string, unknown>>((acc, k) => {
              const val = (v as Record<string, unknown>)[k as keyof typeof v] as unknown;
              acc[k] = sortDeep(val);
              return acc;
            }, {});
        }
        if (Array.isArray(v)) {
          return v.map((x) => String(x));
        }
        return v;
      })(raw),
    );
    return createHash("sha256").update(stable, "utf8").digest("hex");
  } catch {
    return "invalid";
  }
}

/**
 * Token string for Jaccard-style overlap: sorted key:value | ...
 */
export function extractSharedFeatureTokens(
  features: Record<string, string | number | boolean | null> | null | undefined,
): string[] {
  if (features == null) {
    return [];
  }
  const n = normalizeSharedContext(features);
  return Object.keys(n)
    .sort()
    .map((k) => {
      const v = n[k];
      return `${k}:${v === null || v === "" ? "∅" : String(v).toLowerCase()}`;
    });
}
