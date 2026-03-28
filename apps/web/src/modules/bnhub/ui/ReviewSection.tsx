import { prisma } from "@/lib/db";
import { getPublicListingReviews, getListingRatingSummary } from "@/src/modules/reviews/reviewService";
import { getHostBadges } from "@/src/modules/reviews/badgeService";

const badgeLabel: Record<string, string> = {
  top_host: "Top host",
  fast_responder: "Fast responder",
  reliable_host: "Reliable host",
};

function Stars({ value, max = 5 }: { value: number; max?: number }) {
  const v = Math.min(max, Math.max(0, value));
  return (
    <span className="text-amber-400" aria-hidden>
      {"★".repeat(Math.round(v))}
      <span className="text-slate-600">{"★".repeat(max - Math.round(v))}</span>
    </span>
  );
}

export async function ReviewSection({ listingId }: { listingId: string }) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });

  const [aggregate, reviewPage, badges] = await Promise.all([
    getListingRatingSummary(listingId),
    getPublicListingReviews(listingId, { limit: 8 }),
    listing ? getHostBadges(listing.ownerId) : Promise.resolve([]),
  ]);

  const { reviews } = reviewPage;
  const subRows =
    aggregate && aggregate.totalReviews > 0
      ? [
          { label: "Cleanliness", v: aggregate.cleanlinessAvg },
          { label: "Accuracy", v: aggregate.accuracyAvg },
          { label: "Communication", v: aggregate.communicationAvg },
          { label: "Location", v: aggregate.locationAvg },
          { label: "Value", v: aggregate.valueAvg },
          { label: "Check-in", v: aggregate.checkinAvg },
        ]
      : [];

  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-sm font-semibold text-white">Guest reviews</h3>

      {aggregate && aggregate.totalReviews > 0 ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-lg font-semibold text-white">
            <span className="text-amber-400">★</span> {aggregate.avgRating.toFixed(1)}
            <span className="text-xs font-normal text-slate-500">
              {" "}
              · {aggregate.totalReviews} review{aggregate.totalReviews === 1 ? "" : "s"}
            </span>
          </p>
          {subRows.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-3">
              {subRows.map((row) => (
                <li key={row.label} className="flex justify-between gap-2 border-b border-white/5 pb-1">
                  <span>{row.label}</span>
                  <span className="text-slate-200">{row.v.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">No reviews yet — be the first guest to stay.</p>
      )}

      {badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.id}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200"
            >
              {badgeLabel[b.badgeType] ?? b.badgeType.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500">No written reviews to show yet.</p>
        ) : null}
        {reviews.map((r) => (
          <article
            key={r.id}
            className="rounded border border-white/10 bg-white/[0.02] p-2 text-xs text-slate-300"
          >
            <div className="flex flex-wrap items-center gap-2 text-slate-200">
              <Stars value={r.propertyRating} />
              <span className="text-slate-500">
                {r.guest?.name ? r.guest.name.split(/\s+/)[0] : "Guest"} ·{" "}
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1">{r.comment || <span className="text-slate-600">No comment</span>}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
