"use client";

/** Public-safe trust labels only — never raw fraud scores. */
export function TrustBadge({
  verified,
  topHost,
}: {
  verified?: boolean;
  topHost?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {verified && (
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
          Verified host
        </span>
      )}
      {topHost && (
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100">
          Top host
        </span>
      )}
    </div>
  );
}
