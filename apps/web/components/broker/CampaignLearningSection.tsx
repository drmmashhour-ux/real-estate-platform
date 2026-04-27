import { getCampaignLearningSummary } from "@/lib/marketing/campaignLearning";

/**
 * Order 87 — server-rendered block for /dashboard/broker/campaigns.
 */
export async function CampaignLearningSection({ userId, featureEnabled }: { userId: string; featureEnabled: boolean }) {
  if (!featureEnabled) {
    return null;
  }
  const summary = await getCampaignLearningSummary(userId);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Campaign learning</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Simulation-only: learns from your completed campaign simulations (no live ad platforms).
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{summary.recommendation}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">Campaigns analyzed</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.totalCampaignsAnalyzed}</p>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">Winning patterns</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.winningPatternCount}</p>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">Weak patterns</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.weakPatterns.length}</p>
        </div>
      </div>
      {summary.winningPatterns.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Winning</p>
          <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
            {summary.winningPatterns.slice(0, 5).map((p) => (
              <li key={p.id}>
                <span className="font-mono text-xs">{p.platform}</span> · {p.audience}
                {p.city ? ` · ${p.city}` : ""} — {p.pattern} · avg CTR {(p.evidence.avgCtr * 100).toFixed(2)}% · avg CVR{" "}
                {(p.evidence.avgConversionRate * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No winning patterns yet (need 3+ campaigns per segment with strong CTR and conversion).
        </p>
      )}
      {summary.weakPatterns.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Weak</p>
          <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
            {summary.weakPatterns.slice(0, 5).map((p) => (
              <li key={p.id}>
                <span className="font-mono text-xs">{p.platform}</span> · {p.audience}
                {p.city ? ` · ${p.city}` : ""} — {p.pattern} · avg CTR {(p.evidence.avgCtr * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
