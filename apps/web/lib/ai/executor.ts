import { getListingsDB, monolithPrisma } from "@/lib/db";

export type AutonomousAction =
  | {
      type: "listing_improvement";
      issues: string[];
      actions: string[];
    }
  | { type: "price_update"; newPrice: number; changePct?: number }
  | { type: "compliance_block"; message: string };

export type ExecuteContext = {
  /** `listings` table / `@repo/db-marketplace` (optional if only using BNHub path) */
  marketplaceListingId?: string;
  /** Monolith CRM `Listing.id` for compliance holds; omit if unknown */
  crmListingId?: string;
  /**
   * When set, `price_update` updates BNHub `nightPriceCents` from `newPrice` (major currency units
   * per `runAutonomousAgent` / `getDynamicPrice`); takes precedence over `marketplaceListingId`.
   */
  shortTermListingId?: string;
};

/**
 * Materializes orchestrator output. `compliance_block` updates monolith CRM fields
 * (`crm_marketplace_live` + OACIQ hold) — the marketplace client has no `status` field.
 */
export async function executeActions(
  actions: AutonomousAction[],
  ctx: ExecuteContext
): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case "price_update":
        if (ctx.shortTermListingId) {
          await monolithPrisma.shortTermListing.update({
            where: { id: ctx.shortTermListingId },
            data: { nightPriceCents: Math.round(action.newPrice * 100) },
          });
        } else if (ctx.marketplaceListingId) {
          await getListingsDB().listing.update({
            where: { id: ctx.marketplaceListingId },
            data: { price: action.newPrice },
          });
        } else {
          throw new Error(
            "[executeActions] price_update requires shortTermListingId and/or marketplaceListingId in ctx"
          );
        }
        break;

      case "listing_improvement":
        console.log("Suggest improvements:", action.actions, "issues:", action.issues);
        break;

      case "compliance_block": {
        const monolithId = ctx.crmListingId ?? ctx.marketplaceListingId;
        try {
          await monolithPrisma.listing.update({
            where: { id: monolithId },
            data: {
              crmMarketplaceLive: false,
              lecipmOaciqComplianceHoldAt: new Date(),
              lecipmOaciqComplianceHoldReason: "compliance_block",
            },
          });
        } catch (e) {
          console.error(
            "[executeActions] compliance_block: CRM listing update failed (check crmListingId)",
            e
          );
        }
        break;
      }
    }
  }
}
