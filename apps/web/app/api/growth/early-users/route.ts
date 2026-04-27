import { getEarlyUserSignals } from "@/lib/growth/earlyUserSignals";

export const dynamic = "force-dynamic";

/** Short cache for dashboards / banners (Order 45). */
const CACHE_SEC = 15;

/**
 * Public early-user cohort signals (Order 44 / 45).
 * `count` is always the real `EarlyUser` row count.
 */
export async function GET() {
  const signals = await getEarlyUserSignals();
  return Response.json(signals, {
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_SEC}, stale-while-revalidate=30`,
    },
  });
}
