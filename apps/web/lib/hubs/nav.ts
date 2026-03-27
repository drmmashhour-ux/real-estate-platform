/**
 * Top-level product hubs — BuyHub, SellerHub, NBHub (rentals), MortgageHub.
 * Used for nav active states and hub landing CTAs.
 */
export const HUB_LANDING = {
  buy: "/buy",
  sell: "/sell",
  rent: "/rent",
  mortgage: "/mortgage",
} as const;

export const HUB_DASHBOARDS = {
  buyer: "/dashboard/buyer",
  seller: "/dashboard/seller",
  broker: "/dashboard/broker",
  mortgage: "/dashboard/mortgage",
  bnhubHost: "/dashboard/bnhub/host",
} as const;

export function hubNavActive(
  hub: "buy" | "sell" | "rent" | "mortgage",
  pathname: string
): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  switch (hub) {
    case "buy":
      return (
        p === "/buy" ||
        p.startsWith("/buy/") ||
        p.startsWith("/buying") ||
        p.startsWith("/listings")
      );
    case "sell":
      return p === "/sell" || p.startsWith("/sell/") || p.startsWith("/selling");
    case "rent":
      return (
        p === "/rent" ||
        p.startsWith("/rent/") ||
        p.startsWith("/search/bnhub") ||
        p.startsWith("/bnhub") ||
        p.startsWith("/dashboard/bnhub")
      );
    case "mortgage":
      return p === "/mortgage" || p.startsWith("/mortgage/");
    default:
      return false;
  }
}
