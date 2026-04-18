/**
 * Host value preview — qualitative framing only; not a payout guarantee.
 */
export function buildHostValuePreviewText(opts: { city: string; estimatedNightlyCents?: number | null }) {
  const c = opts.city.trim() || "your market";
  const nightly =
    opts.estimatedNightlyCents != null
      ? `$${(opts.estimatedNightlyCents / 100).toFixed(0)}`
      : "your target nightly rate";
  return {
    headline: `Show travelers what makes your stay different in ${c}`,
    bullets: [
      `Price positioning around ${nightly} is a planning anchor — real payouts depend on calendar, fees, and demand.`,
      "Guests book where trust is obvious: photos, rules, and response time.",
    ],
    disclaimer: "Estimates are illustrative; use BNHub pricing tools and your own operating costs.",
  };
}
