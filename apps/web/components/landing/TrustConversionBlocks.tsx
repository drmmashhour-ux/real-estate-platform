import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/ai/userProfile";
import type { PricingBias, TrustMessageVariant } from "@/lib/ai/personalizationEngine";
import { getTrustSignals } from "@/lib/market/trustSignals";
import { earlyUsersJoinedLine } from "@/lib/growth/launchBannerModel";

export type TrustConversionBlocksProps = {
  /** `inverted` matches dark LECIPM marketing pages (e.g. luxury home). */
  variant?: "default" | "inverted";
  /** When set, demand and city-level listing/scarcity signals are loaded. */
  city?: string;
  /** Optional behavior profile for pricing perception copy (recommendation flag + session). */
  userProfile?: UserProfile;
  pricingBias?: PricingBias;
  trustMessageVariant?: TrustMessageVariant;
  /** From the same `getEarlyUserSignals` / early-user count as the hero and launch strip — avoids extra SQL. */
  earlyUsersJoined?: number | null;
};

function personalizedPricingLine(bias: PricingBias | undefined): string | null {
  if (bias === "premium") return "Prices are firming in markets you care about — book with clarity.";
  if (bias === "discount") return "Best deals available — rates in your range are within reach.";
  if (bias === "neutral") return "Balanced, transparent nightly rates you can trust.";
  return null;
}

export async function TrustConversionBlocks({
  variant = "default",
  city,
  pricingBias,
  trustMessageVariant = "security",
  earlyUsersJoined = null,
}: TrustConversionBlocksProps) {
  const signals = await getTrustSignals(city);
  const inverted = variant === "inverted";

  const showVerifiedCount = signals.listingCount > 0;
  const showViews = signals.viewsToday > 0;
  const showPersonalizedPricing = Boolean(pricingBias) && Boolean(personalizedPricingLine(pricingBias));

  const subMuted = cn("text-sm", inverted ? "text-zinc-400" : "text-muted-foreground");
  const subAccent = cn("text-sm font-medium", inverted ? "text-[#D4AF37]/90" : "text-foreground");
  const bodyMuted = (offset: "tight" | "loose") =>
    cn(
      "text-sm",
      offset === "loose" ? "mt-3" : "mt-2",
      inverted ? "text-zinc-400" : "text-muted-foreground"
    );

  const socialSub =
    trustMessageVariant === "social_proof"
      ? "Others with similar taste are active today — you’re in good company."
      : trustMessageVariant === "urgency"
        ? "Hot markets move fast; verified listings help you choose with confidence."
        : "Real activity from guests and hosts exploring stays on the marketplace.";

  const securityLead =
    trustMessageVariant === "security"
      ? "Structured flows and clear records — built for host control and guest peace of mind."
      : "Booking flows that prioritize clarity, host controls, and audit-friendly records for your comfort.";

  return (
    <Wrap inverted={inverted}>
      <section
        className={cn("mx-auto max-w-6xl px-6 py-16", inverted && "text-white")}
        aria-label="Trust and conversion"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div
            className={cn("rounded-2xl p-6", inverted ? "border border-white/10 bg-white/[0.04]" : "border")}
          >
            <h3 className={cn("text-lg font-semibold", inverted && "text-white")}>Verified Listings</h3>
            {showPersonalizedPricing ? (
              <p className={cn("mt-2 text-sm font-medium", inverted ? "text-amber-200/90" : "text-foreground")}>
                {personalizedPricingLine(pricingBias)}
              </p>
            ) : null}
            {signals.demandMessage || showVerifiedCount || signals.scarcityMessage ? (
              <div className="mt-2 space-y-1.5">
                {signals.demandMessage ? <p className={subAccent}>{signals.demandMessage}</p> : null}
                {showVerifiedCount ? (
                  <p className={subMuted}>All listings verified • {signals.listingCount} active listings</p>
                ) : null}
                {signals.scarcityMessage ? <p className={subMuted}>{signals.scarcityMessage}</p> : null}
              </div>
            ) : null}
            <p className={bodyMuted("loose")}>
              Listings can be checked for quality, trust, and required documentation before publication.
            </p>
          </div>

          <div
            className={cn("rounded-2xl p-6", inverted ? "border border-white/10 bg-white/[0.04]" : "border")}
          >
            <h3 className={cn("text-lg font-semibold", inverted && "text-white")}>
              {earlyUsersJoined != null ? "Trusted by early users" : "Trusted by users"}
            </h3>
            {earlyUsersJoined != null ? (
              <p className={cn("mt-2 text-sm font-medium", inverted ? "text-zinc-200" : "text-foreground")}>
                {earlyUsersJoinedLine(earlyUsersJoined)}
              </p>
            ) : null}
            {showViews ? (
              <p className={cn("mt-2 text-sm", inverted ? "text-zinc-300" : "text-muted-foreground")}>
                Over {signals.viewsToday.toLocaleString()} users viewed listings in the last 24 hours
              </p>
            ) : null}
            <p className={bodyMuted(showViews || earlyUsersJoined != null ? "loose" : "tight")}>{socialSub}</p>
          </div>

          <div
            className={cn("rounded-2xl p-6", inverted ? "border border-white/10 bg-white/[0.04]" : "border")}
          >
            <h3 className={cn("text-lg font-semibold", inverted && "text-white")}>Secure Transactions</h3>
            <p className={cn("mt-2 text-sm", inverted ? "text-zinc-400" : "text-muted-foreground")}>
              {securityLead}
            </p>
          </div>
        </div>
      </section>
    </Wrap>
  );
}

function Wrap({ inverted, children }: { inverted: boolean; children: ReactNode }) {
  if (inverted) {
    return <div className="w-full border-b border-t border-white/5 bg-zinc-950/50">{children}</div>;
  }
  return <>{children}</>;
}
