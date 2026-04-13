import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ListingStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getHomepageFeaturedWinnerIds } from "@/lib/bnhub/featured-home-winners";

/** 6–8 cards above the fold — enough variety without overwhelming scan. */
const TAKE = 8;

const select = {
  id: true,
  listingCode: true,
  city: true,
  region: true,
  province: true,
  nightPriceCents: true,
  currency: true,
  photos: true,
} satisfies Prisma.ShortTermListingSelect;

type Row = Prisma.ShortTermListingGetPayload<{ select: typeof select }>;

function fmt(cents: number, currency: string) {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "CAD" }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function coverPhoto(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const s = photos.find((p): p is string => typeof p === "string");
  return s ?? null;
}

function locationLine(city: string, region: string | null | undefined, province: string | null | undefined): string {
  const c = city?.trim() || "";
  const sub = (province?.trim() || region?.trim() || "").trim();
  if (c && sub) return `${c}, ${sub}`;
  return c || sub || "—";
}

/** Published BNHUB stays for the home page — server-rendered for instant paint. */
export async function HomeFeaturedListings({
  locale,
  country,
}: {
  locale: string;
  country: string;
}) {
  const t = await getTranslations("home");
  let rows: Row[] = [];
  let popularIds = new Set<string>();
  try {
    const winnerIds = await getHomepageFeaturedWinnerIds(TAKE).catch(() => [] as string[]);
    popularIds = new Set(winnerIds.slice(0, 3));
    const primary =
      winnerIds.length > 0
        ? await prisma.shortTermListing.findMany({
            where: { listingStatus: ListingStatus.PUBLISHED, id: { in: winnerIds } },
            select,
          })
        : [];
    const order = new Map(winnerIds.map((id, idx) => [id, idx] as const));
    primary.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
    const rest = await prisma.shortTermListing.findMany({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        ...(primary.length ? { id: { notIn: primary.map((p) => p.id) } } : {}),
      },
      select,
      orderBy: { updatedAt: "desc" },
      take: Math.max(0, TAKE - primary.length),
    });
    rows = [...primary, ...rest].slice(0, TAKE);
  } catch {
    return null;
  }

  const base = `/${locale}/${country}`;
  const allListingsHref = `${base}/bnhub/stays`;
  const montrealStaysHref = `${base}/bnhub/stays?city=${encodeURIComponent("Montreal")}`;

  if (rows.length === 0) {
    return (
      <section
        id="home-featured"
        className="border-t border-white/10 bg-black pb-12 pt-6 md:pb-16 md:pt-8"
        aria-labelledby="home-featured-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="home-featured-heading" className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {t("emptyFeaturedTitle")}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/65">{t("emptyFeaturedBody")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={montrealStaysHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#D4AF37] px-5 text-sm font-bold text-black shadow-md transition hover:bg-[#e8c85c]"
            >
              {t("emptyFeaturedCta")}
            </Link>
            <Link
              href={`${base}/bnhub/stays`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-semibold text-white/90 hover:bg-white/5"
            >
              {t("viewAllListings")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const viewAllClassName =
    "inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#D4AF37]/55 bg-[#D4AF37]/12 px-5 text-sm font-bold text-[#D4AF37] shadow-sm transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/22 active:scale-[0.99]";

  return (
    <section
      id="home-featured"
      className="border-t border-white/10 bg-black pb-12 pt-6 md:pb-16 md:pt-8"
      aria-labelledby="home-featured-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 id="home-featured-heading" className="text-left text-lg font-semibold tracking-tight text-white sm:text-xl">
            {t("featuredTitle")}
          </h2>
          <Link href={allListingsHref} className={`${viewAllClassName} w-full sm:w-auto sm:shrink-0 sm:self-start`}>
            {t("viewAllListings")}
            <span className="ml-2" aria-hidden>
              →
            </span>
          </Link>
        </div>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-6 sm:gap-4 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {rows.map((l, i) => {
            const href = `${base}/bnhub/stays/${encodeURIComponent(l.listingCode || l.id)}`;
            const img = coverPhoto(l.photos);
            const loc = locationLine(l.city, l.region, l.province);
            return (
              <Link
                key={l.id}
                href={href}
                className="group flex w-[min(48vw,14rem)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] text-left shadow-md ring-1 ring-white/5 transition hover:border-[#D4AF37]/50 hover:shadow-lg active:scale-[0.99] sm:w-[min(42vw,15rem)] lg:w-full lg:max-w-none lg:shrink"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-white/10 to-neutral-900">
                  {popularIds.has(l.id) ? (
                    <span className="absolute left-2 top-2 z-10 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]">
                      Popular on BNHUB
                    </span>
                  ) : null}
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary CDN URLs; native lazy-load + fetchPriority for LCP
                    <img
                      src={img}
                      alt=""
                      sizes="(max-width: 1024px) 48vw, 25vw"
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                      loading={i < 2 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={i === 0 ? "high" : "auto"}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-900">
                      <span className="text-2xl font-semibold text-[#D4AF37]/30" aria-hidden>
                        {(l.city?.trim().charAt(0) || "·").toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex min-h-[4.5rem] flex-1 flex-col justify-center border-t border-white/10 p-3">
                  <p className="text-base font-bold tabular-nums leading-tight text-[#D4AF37]">
                    {fmt(l.nightPriceCents, l.currency)}
                    <span className="ml-1 text-xs font-semibold text-white/45">/ night</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white/85">{loc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
