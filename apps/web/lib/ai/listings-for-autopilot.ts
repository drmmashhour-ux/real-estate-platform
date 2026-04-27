import { getListingsDB } from "@/lib/db";
import type { AutonomousAgentListing } from "./orchestrator";
import type { ListingSignals } from "./anomaly";

const DEFAULT_TAKE = 30;
/** Hard cap for autopilot batch fan-out (load safety). */
const MAX_TAKE = 100;

/**
 * Bounded set of **marketplace‑live** CRM listings (sale/hybrid pipeline). Tweak `take` per cron SLO.
 */
export async function getListingsForAutopilot(opts?: { take?: number }): Promise<AutonomousAgentListing[]> {
  const take = Math.min(MAX_TAKE, Math.max(1, Math.floor(opts?.take ?? DEFAULT_TAKE)));
  const rows = await getListingsDB().listing.findMany({
    where: { crmMarketplaceLive: true },
    take,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    price: r.price,
  }));
}

/**
 * Heuristic signals: booking count from `listing_bookings`; **views** are not in CRM (0 until wired
 * to analytics / growth_events in a follow-up).
 */
export async function getListingSignalsForAutopilot(listingId: string): Promise<ListingSignals> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const bookings30d = await getListingsDB().listingBooking.count({
    where: { listingId, createdAt: { gte: since } },
  });
  const views = 0;
  const occupancyRate = Math.min(1, Math.max(0, bookings30d / 30));
  return { occupancyRate, bookings30d, views };
}
