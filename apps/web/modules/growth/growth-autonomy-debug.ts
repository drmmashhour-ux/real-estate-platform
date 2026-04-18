/**
 * Debug / internal instrumentation for autonomy API and panel.
 */

export const GROWTH_AUTONOMY_DEBUG_QUERY = "growthAutonomyDebug" as const;

export function growthAutonomyApiRequestHasDebug(req: Request): boolean {
  try {
    const url = new URL(req.url);
    return url.searchParams.get(GROWTH_AUTONOMY_DEBUG_QUERY) === "1";
  } catch {
    return false;
  }
}

export function shouldShowGrowthAutonomyDebugUi(searchParam?: string | null): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") return true;
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GROWTH_AUTONOMY_DEBUG === "1") return true;
  return searchParam === "1";
}
