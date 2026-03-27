import { prisma } from "@/lib/db";

export async function ReviewSection({ listingId }: { listingId: string }) {
  const reviews = await prisma.review.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, propertyRating: true, comment: true, createdAt: true },
  });

  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-sm font-semibold text-white">Guest reviews</h3>
      <div className="mt-3 space-y-2">
        {reviews.length === 0 ? <p className="text-xs text-slate-500">No reviews yet.</p> : null}
        {reviews.map((r) => (
          <article key={r.id} className="rounded border border-white/10 bg-white/[0.02] p-2 text-xs text-slate-300">
            <p className="text-slate-200">Rating: {r.propertyRating}/5</p>
            <p>{r.comment || "No comment"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

