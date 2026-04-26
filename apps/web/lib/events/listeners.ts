import { runAutonomousAgent, type AutonomousAgentListing } from "@/lib/ai/orchestrator";
import { executeActions } from "@/lib/ai/executor";
type OnFn = (event: string, handler: (p: Record<string, unknown>) => void | Promise<void>) => void;

/**
 * In-process event wiring for autonomous follow-ups. Call with `on` from `lib/events` (no import cycle).
 * DB writes in `listing.updated` only when `AUTONOMOUS_LOOP_EXEC=1`.
 */
export function registerEventListeners(on: OnFn) {
  on("listing.updated", async (raw) => {
    const listing = raw as AutonomousAgentListing;
    if (!listing?.id || typeof listing.id !== "string") {
      return;
    }
    const actions = await runAutonomousAgent(listing);
    if (process.env.AUTONOMOUS_LOOP_EXEC === "1") {
      const st =
        typeof listing.shortTermListingId === "string" && listing.shortTermListingId.trim()
          ? listing.shortTermListingId.trim()
          : undefined;
      await executeActions(actions, {
        marketplaceListingId: listing.id,
        crmListingId:
          typeof listing.crmListingId === "string" && listing.crmListingId.trim()
            ? listing.crmListingId.trim()
            : undefined,
        shortTermListingId: st,
      });
    } else {
      console.log(
        "[autonomous] listing.updated — dry run (set AUTONOMOUS_LOOP_EXEC=1 to apply actions)",
        actions
      );
    }
  });

  on("booking.created", async (data) => {
    console.log("Trigger pricing update for", data.listingId);
    console.log("Re-evaluate pricing after booking", data.listingId);
  });
}
