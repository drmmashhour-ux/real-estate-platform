import type { BnhubListingMarketingProfile } from "@prisma/client";
import { m } from "./marketing-ui-classes";

export function MarketingReadinessCard({
  profile,
  onRefresh,
  busy,
}: {
  profile: BnhubListingMarketingProfile | null;
  onRefresh?: () => void;
  busy?: boolean;
}) {
  if (!profile) {
    return (
      <div className={m.card}>
        <p className={m.subtitle}>No marketing profile yet. Run readiness to score this listing.</p>
        {onRefresh ? (
          <button type="button" className={`${m.btnPrimary} mt-4`} onClick={onRefresh} disabled={busy}>
            {busy ? "Computing…" : "Compute readiness"}
          </button>
        ) : null}
      </div>
    );
  }

  const score = profile.readinessScore ?? 0;
  const rawMissing = profile.missingItemsJson;
  const missing = Array.isArray(rawMissing) ? rawMissing.filter((x): x is string => typeof x === "string") : [];

  return (
    <div className={m.card}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className={m.title}>Promotion readiness</h3>
          <p className={m.subtitle}>Weighted internal score — not a public quality guarantee.</p>
        </div>
        {onRefresh ? (
          <button type="button" className={m.btnGhost} onClick={onRefresh} disabled={busy}>
            {busy ? "…" : "Refresh"}
          </button>
        ) : null}
      </div>
      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <p className="mb-4 text-2xl font-bold tabular-nums text-amber-400">{Math.round(score)}</p>
      {profile.recommendedAngle ? (
        <p className="mb-2 text-sm text-zinc-300">
          <span className="text-zinc-500">Suggested angle:</span>{" "}
          <span className="font-medium text-white">{profile.recommendedAngle}</span>
        </p>
      ) : null}
      {missing.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Missing or weak</p>
          <ul className="list-inside list-disc text-sm text-zinc-400">
            {missing.slice(0, 8).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-emerald-400/90">No major gaps flagged — good baseline for promotion.</p>
      )}
    </div>
  );
}
