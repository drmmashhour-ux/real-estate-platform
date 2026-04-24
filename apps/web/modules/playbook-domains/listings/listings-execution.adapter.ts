const RANKING_ACTIONS = new Set([
  "listing_ranking_adjust",
  "search_ranking_tweak",
  "listing_order_adjust",
  "relevance_tweak",
]);

const MESSAGING_TOKENS = ["message", "sms", "whatsapp", "email", "notify", "outbound", "push"];

function hasMessagingToken(at: string): boolean {
  for (const t of MESSAGING_TOKENS) {
    if (at.includes(t)) {
      return true;
    }
  }
  return false;
}

/**
 * Listings: ranking / relevance / search ordering only (no outbound comms). Additive deny patterns.
 */
export function createListingsExecutionAdapter() {
  return {
    canExecute(actionType: string): boolean {
      const at = (actionType ?? "").trim().toLowerCase();
      if (!at) {
        return false;
      }
      if (hasMessagingToken(at)) {
        return false;
      }
      if (RANKING_ACTIONS.has(at)) {
        return true;
      }
      if (at.startsWith("listing_rank") || at.startsWith("search_rank") || at.startsWith("search_") || at.startsWith("listing_")) {
        return true;
      }
      if (at.includes("rank") || at.includes("relevance") || at.includes("sort") || at.includes("boost")) {
        return true;
      }
      return false;
    },
    async execute(actionType: string, payload: unknown): Promise<{ success: boolean }> {
      void actionType;
      void payload;
      return { success: true };
    },
  };
}
