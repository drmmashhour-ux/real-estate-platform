/**
 * Market-aware policy hooks for hubs — extend per tenant/market without branching UI.
 */

export type HubMarketPolicy = {
  hubKey: string;
  /** ISO region or market code */
  region?: string;
  /** Feature gates for tax, payments, language */
  allowOnlinePayments: boolean;
  supportedLocales: readonly string[];
};

export function defaultMarketPolicy(hubKey: string): HubMarketPolicy {
  return {
    hubKey,
    region: undefined,
    allowOnlinePayments: true,
    supportedLocales: ["en", "fr", "ar"],
  };
}
