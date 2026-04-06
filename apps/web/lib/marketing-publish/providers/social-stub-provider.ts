import type { MarketingPublishInput, ProviderPublishResult } from "../types";
import { isMarketingSocialLiveEnabled } from "../marketing-email-recipients";

/**
 * Placeholder for OAuth-based social APIs. Never calls external networks unless
 * MARKETING_SOCIAL_LIVE_SEND=1 and a future real client is wired (not in this phase).
 */
export function createSocialStubProvider(label: string) {
  return async function publish(input: MarketingPublishInput): Promise<ProviderPublishResult> {
    const live = isMarketingSocialLiveEnabled() && input.allowLive;
    const preview = input.bodyText.slice(0, 280);
    const target = input.publishTargetId?.trim() || "(default account)";

    if (live) {
      return {
        ok: false,
        executedDryRun: false,
        errorMessage: `${label} live API not implemented; keep MARKETING_SOCIAL_LIVE_SEND off or use dry-run`,
        summary: "Blocked: no OAuth client",
      };
    }

    return {
      ok: true,
      executedDryRun: true,
      externalPostId: null,
      summary: `[${label} dry-run] target=${target} chars=${input.bodyText.length} preview="${preview.replace(/"/g, "'")}…"`,
    };
  };
}
