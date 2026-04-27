import { getCampaignFeedbackInsights } from "@/lib/marketing/campaignFeedback";
import { CAMPAIGN_FEEDBACK_MIN_CAMPAIGNS } from "@/lib/marketing/campaignFeedbackTypes";

/**
 * Order 88 — "Performance insights" on broker campaigns (simulation-only).
 */
export async function CampaignPerformanceInsightsSection({
  userId,
  featureEnabled,
}: {
  userId: string;
  featureEnabled: boolean;
}) {
  if (!featureEnabled) {
    return null;
  }
  const f = await getCampaignFeedbackInsights(userId);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Performance insights</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Derived from your simulated ad campaigns. Feedback applies to new copy only after {CAMPAIGN_FEEDBACK_MIN_CAMPAIGNS}{" "}
          campaigns with results — past campaigns are never changed.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">Best platform (avg CTR)</p>
          <p className="mt-1 font-medium">{f.eligible && f.bestPlatform ? f.bestPlatform : "—"}</p>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">Best audience (avg CVR)</p>
          <p className="mt-1 font-medium">{f.eligible && f.bestAudience ? f.bestAudience : "—"}</p>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">Top city (conversions)</p>
          <p className="mt-1 font-medium">{f.eligible && f.bestCity ? f.bestCity : "—"}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
        <p>
          Avg CTR:{" "}
          <span className="font-mono text-foreground">{(f.avgCtr * 100).toFixed(2)}%</span>
        </p>
        <p>
          Avg conversion rate:{" "}
          <span className="font-mono text-foreground">{(f.avgConversionRate * 100).toFixed(2)}%</span>
        </p>
      </div>
      <p className="text-sm text-foreground/90">{f.recommendation}</p>
    </div>
  );
}
