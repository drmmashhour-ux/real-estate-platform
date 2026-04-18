/**
 * LECIPM CRO — trust copy for BNHub listing + checkout (no fabricated claims).
 */

export type CroTrustBullet = {
  id: "verified_listing" | "secure_stripe" | "trusted_platform";
  text: string;
  visible: boolean;
};

export type CroTrustSignalPack = {
  headline: string;
  bullets: CroTrustBullet[];
  /** Short line for checkout hero */
  secureCheckoutLabel: string;
  noHiddenFeesLine: string;
};

export { evaluateTrustImpact } from "./cro-performance.service";

export function buildBnhubStayTrustPack(input: {
  listingVerified: boolean;
  stripeCheckoutAvailable: boolean;
}): CroTrustSignalPack {
  return {
    headline: "Book with confidence",
    bullets: [
      {
        id: "verified_listing",
        text: "Verified listing",
        visible: input.listingVerified,
      },
      {
        id: "secure_stripe",
        text: "Secure payment via Stripe",
        visible: input.stripeCheckoutAvailable,
      },
      {
        id: "trusted_platform",
        text: "Trusted platform",
        visible: true,
      },
    ],
    secureCheckoutLabel: "Secure checkout",
    noHiddenFeesLine: "No hidden fees — taxes and service fee are shown before you pay.",
  };
}
