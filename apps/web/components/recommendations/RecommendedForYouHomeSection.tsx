import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getPersonalizedRecommendations } from "@/modules/personalized-recommendations";
import { routing } from "@/i18n/routing";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";

type Props = {
  base: string;
  locale?: string;
  country?: string;
};

export async function RecommendedForYouHomeSection({
  base,
  locale = routing.defaultLocale,
  country = DEFAULT_COUNTRY_SLUG,
}: Props) {
  const userId = await getGuestId();
  const buyer = await getPersonalizedRecommendations({
    userId,
    mode: "BUYER",
    limit: 6,
    personalization: true,
  });

  if (buyer.items.length === 0) return null;

  return (
    <section className="relative px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/80">For you</p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Recommended for you</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/55">
            {buyer.privacyNote}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {buyer.items.map((item) => (
            <Link
              key={item.entityId}
              href={`/${locale}/${country}${item.href ?? `/listings/${item.entityId}`}`}
              className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] transition hover:border-[#D4AF37]/35"
            >
              <div className="aspect-[16/10] bg-white/5">
                {item.imageUrl ?
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                : <div className="flex h-full items-center justify-center text-xs text-white/35">No image</div>}
              </div>
              <div className="space-y-2 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]/90">
                  Score {item.score} · {item.confidence}% confidence
                </p>
                <h3 className="text-lg font-medium text-white">{item.title}</h3>
                <p className="text-sm text-white/55">{item.subtitle}</p>
                <p className="text-xs text-white/45">{item.explanationUserSafe}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href={`${base}/listings`}
            className="inline-flex rounded-full border border-[#D4AF37]/50 px-6 py-3 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            Browse all listings
          </Link>
        </div>
      </div>
    </section>
  );
}
