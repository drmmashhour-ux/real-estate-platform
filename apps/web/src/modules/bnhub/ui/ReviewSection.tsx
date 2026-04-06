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
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">Guest reviews</h3>

      {aggregate && aggregate.totalReviews > 0 ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-lg font-semibold text-slate-900">
            <span className="text-amber-400">★</span> {aggregate.avgRating.toFixed(1)}
            <span className="text-xs font-normal text-slate-500">
              {" "}
              · {aggregate.totalReviews} review{aggregate.totalReviews === 1 ? "" : "s"}
            </span>
          </p>
          {subRows.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
              {subRows.map((row) => (
                <li key={row.label} className="flex justify-between gap-2 border-b border-slate-200 pb-1">
                  <span>{row.label}</span>
                  <span className="text-slate-800">{row.v.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No reviews yet — be the first guest to stay.</p>
      )}

      {badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.id}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700"
            >
              {badgeLabel[b.badgeType] ?? b.badgeType.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No written reviews to show yet.</p>
        ) : null}
        {reviews.map((r) => (
          <article
            key={r.id}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
          >
            <div className="flex flex-wrap items-center gap-2 text-slate-800">
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
