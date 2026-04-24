import { extractSharedFeatureTokens } from "../shared/shared-context-signature";
import { normalizeSharedContext } from "../shared/shared-context-normalize";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) {
    return 0;
  }
  return Math.max(0, Math.min(1, x));
}

/**
 * Jaccard overlap on feature tokens. Deterministic.
 */
export function computeSharedFeatureFit(
  a: Record<string, string | number | boolean | null> | null | undefined,
  b: Record<string, string | number | boolean | null> | null | undefined,
): number {
  try {
    const ta = new Set(extractSharedFeatureTokens(a ?? undefined));
    const tb = new Set(extractSharedFeatureTokens(b ?? undefined));
    if (ta.size === 0 && tb.size === 0) {
      return 0.4;
    }
    if (ta.size === 0 || tb.size === 0) {
      return 0.15;
    }
    let inter = 0;
    for (const t of ta) {
      if (tb.has(t)) {
        inter += 1;
      }
    }
    const union = ta.size + tb.size - inter;
    if (union <= 0) {
      return 0.2;
    }
    return clamp01(inter / union);
  } catch {
    return 0.2;
  }
}

/**
 * When comparing raw Json / prisma objects, normalize to flat maps first.
 */
export function computeJsonFeatureFit(a: unknown, b: unknown): number {
  const ar =
    a && typeof a === "object" && !Array.isArray(a) ? (normalizeSharedContext(a) as Record<string, string | number | boolean | null>) : {};
  const br =
    b && typeof b === "object" && !Array.isArray(b) ? (normalizeSharedContext(b) as Record<string, string | number | boolean | null>) : {};
  return computeSharedFeatureFit(ar, br);
}
