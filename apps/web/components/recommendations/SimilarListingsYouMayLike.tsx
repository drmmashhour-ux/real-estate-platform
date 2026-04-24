import Link from "next/link";
import { Suspense } from "react";
import { getGuestId } from "@/lib/auth/session";
import { getSimilarFsboForListingPage } from "@/modules/personalized-recommendations";

type Props = {
  seedFsboListingId: string;
  locale: string;
  country: string;
};

async function SimilarInner({ seedFsboListingId, locale, country }: Props) {
  const userId = await getGuestId();
  const rec = await getSimilarFsboForListingPage({
    userId,
    seedFsboListingId,
    limit: 4,
    personalization: true,
  });
  if (rec.items.length === 0) return null;

  const prefix = `/${locale}/${country}`;

  return (
    <section className="border-t border-slate-800 bg-slate-950 px-4 py-12 text-slate-200">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-lg font-semibold text-white">Similar listings you may like</h2>
        <p className="mt-1 text-xs text-slate-500">{rec.privacyNote}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rec.items.map((item) => (
            <Link
              key={item.entityId}
              href={`${prefix}${item.href ?? `/listings/${item.entityId}`}`}
              className="rounded-xl border border-white/10 bg-black/30 p-3 transition hover:border-emerald-500/40"
            >
              <p className="text-[10px] uppercase text-emerald-400/90">Match {item.score}</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium text-white">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
              <p className="mt-2 text-[11px] text-slate-400">{item.explanationUserSafe}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SimilarListingsYouMayLike(props: Props) {
  return (
    <Suspense fallback={null}>
      <SimilarInner {...props} />
    </Suspense>
  );
}
