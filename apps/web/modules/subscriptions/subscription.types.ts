/**
 * LECIPM subscription verticals — map to Stripe-backed rows (`subscriptions`, `broker_lecipm_subscriptions`)
 * plus `metadata.lecipmHubKind` on workspace subscriptions.
 */

export type SubscriptionVertical = "BROKER" | "INVESTOR" | "RESIDENCE" | "FAMILY";

export type SubscriptionActivationStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unknown";

export type UserSubscriptionRecord = {
  vertical: SubscriptionVertical;
  status: SubscriptionActivationStatus;
  planLabel: string;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  mrrCents: number | null;
};

export type UserSubscriptionBundle = {
  userId: string;
  subscriptions: UserSubscriptionRecord[];
};

export class SubscriptionRequiredError extends Error {
  readonly vertical: SubscriptionVertical;

  constructor(vertical: SubscriptionVertical, message?: string) {
    super(message ?? `Active ${vertical} subscription required`);
    this.name = "SubscriptionRequiredError";
    this.vertical = vertical;
  }
}
