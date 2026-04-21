import type { GreenListingMetadata } from "@/modules/green/green.types";

type Snapshot = NonNullable<GreenListingMetadata["grantsSnapshot"]>;

/** Illustrative Québec-oriented programs — pairing with upgrade advisor output */
export function AvailableFinancialSupport({ snapshot }: { snapshot: Snapshot }) {
  const hasRows = snapshot.eligibleGrants.length > 0;

  return (
    <div className="mt-3 rounded-lg border border-sky-500/25 bg-sky-950/30 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300/95">Available Financial Support</p>
      {!hasRows ? (
        <p className="mt-2 text-xs text-slate-500">
          No illustrative programs matched this profile yet — add heating, envelope, or solar upgrade intent in your intake.
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {snapshot.eligibleGrants.map((g) => (
            <li key={g.id} className="rounded-md border border-white/10 bg-black/30 px-2.5 py-2">
              <p className="text-sm font-medium text-white">{g.name}</p>
              <p className="mt-0.5 text-xs font-medium text-sky-200/90">Estimated support: {g.amount}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">{g.reason}</p>
              <p className="mt-2 text-[11px] leading-snug text-slate-300">
                <span className="font-medium text-slate-200">How to apply:</span> {g.howToApply}
              </p>
            </li>
          ))}
        </ul>
      )}

      {snapshot.byRecommendation.some((r) => r.grants.length > 0) ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Per recommendation</p>
          <ul className="mt-2 space-y-2">
            {snapshot.byRecommendation
              .filter((r) => r.grants.length > 0)
              .map((r) => (
                <li key={r.action} className="text-xs text-slate-400">
                  <span className="font-medium text-slate-300">{r.action}</span>
                  <span className="mx-1 text-slate-600">—</span>
                  {r.grants.map((g) => g.name).join(" · ")}
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{snapshot.disclaimer}</p>
    </div>
  );
}
