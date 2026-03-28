"use client";

import Link from "next/link";

/** Sanitized listing trust snapshot (matches `/api/trustgraph/listings/:id/status`). */
export type ListingTrustSnapshotSafe = {
  trustLevel: string | null;
  displayScore: number | null;
  readinessLevel: string | null;
  publicBadgeLabels: string[];
  missingItemsCount: number;
  sellerActionRequired: boolean;
  recommendedActionsCount: number;
  lastVerifiedAt: string | null;
};

type Props = {
  listingId: string;
  snapshot: ListingTrustSnapshotSafe | null;
  role?: "seller" | "broker" | "admin";
};

export function ListingTrustBadge({ listingId, snapshot, role = "seller" }: Props) {
  if (!snapshot) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-400">
        <span className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Trust</span>
        <p className="mt-1 text-xs">Run a save to refresh trust readiness.</p>
      </div>
    );
  }

  const eligibleHighTrust =
    snapshot.trustLevel === "verified" || snapshot.trustLevel === "high";

  const ctaHref =
    role === "admin"
      ? `/admin/fsbo/${encodeURIComponent(listingId)}/edit`
      : `/dashboard/seller/create?id=${encodeURIComponent(listingId)}`;

  const ctaLabel = role === "admin" ? "Open in admin" : "Improve listing";

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Trust & readiness</span>
        {snapshot.displayScore != null ? (
          <span className="text-lg font-bold text-white">
            {snapshot.displayScore}
            <span className="text-xs font-normal text-slate-500">/100</span>
          </span>
        ) : (
          <span className="text-xs text-slate-500">Score pending</span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {snapshot.publicBadgeLabels.length > 0 ? snapshot.publicBadgeLabels.join(" · ") : "Standard listing"}
        {eligibleHighTrust ? " · Eligible for high-trust placement" : ""}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Readiness: {snapshot.readinessLevel?.replace(/_/g, " ") ?? "—"}
        {snapshot.sellerActionRequired ? " · Action needed" : ""}
      </p>
      {snapshot.missingItemsCount > 0 || snapshot.recommendedActionsCount > 0 ? (
        <p className="mt-1 text-xs text-amber-200/90">
          {snapshot.missingItemsCount > 0 ? `${snapshot.missingItemsCount} item(s) to review` : null}
          {snapshot.missingItemsCount > 0 && snapshot.recommendedActionsCount > 0 ? " · " : ""}
          {snapshot.recommendedActionsCount > 0 ? `${snapshot.recommendedActionsCount} recommended action(s)` : null}
        </p>
      ) : null}
      <Link href={ctaHref} className="mt-2 inline-block text-xs font-medium text-premium-gold hover:underline">
        {ctaLabel}
      </Link>
    </div>
  );
}
