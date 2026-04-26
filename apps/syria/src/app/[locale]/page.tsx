import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { HeroSegmentedSearch } from "@/components/HeroSegmentedSearch";
import { isBnhubInSyriaUI, syriaFlags } from "@/lib/platform-flags";
import { Card } from "@/components/ui/Card";
import type { SyriaProperty } from "@/generated/prisma";

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const showBnhubHome = isBnhubInSyriaUI();
  const bnhubOn = syriaFlags.BNHUB_ENABLED && showBnhubHome;

  let publishedCount = 0;
  let latestListings: SyriaProperty[] = [];
  try {
    const [rows, count] = await prisma.$transaction([
      prisma.syriaProperty.findMany({
        where: { status: "PUBLISHED", fraudFlag: false },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.syriaProperty.count({
        where: { status: "PUBLISHED", fraudFlag: false },
      }),
    ]);
    latestListings = rows;
    publishedCount = count;
  } catch {
    latestListings = [];
    publishedCount = 0;
  }

  let bnhubRows: SyriaProperty[] = [];
  if (bnhubOn) {
    try {
      bnhubRows = await prisma.syriaProperty.findMany({
        where: { type: "BNHUB", status: "PUBLISHED", fraudFlag: false },
        orderBy: [{ plan: "desc" }, { createdAt: "desc" }],
        take: 4,
      });
    } catch {
      bnhubRows = [];
    }
  }

  const cards =
    latestListings.length > 0
      ? latestListings.map((l, i) => <ListingCard key={l.id} listing={l} locale={locale} priority={i < 3} />)
      : null;

  const bnhubCards =
    bnhubRows.length > 0 ? bnhubRows.map((l) => <ListingCard key={l.id} listing={l} locale={locale} />) : null;

  return (
    <div className="space-y-16 sm:space-y-20">
      <div className="rounded-[var(--darlink-radius-2xl)] border border-amber-400/35 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-600/15 px-4 py-3.5 text-center sm:px-6">
        <p className="text-sm font-bold leading-snug text-amber-950 sm:text-base">{t("tractionBanner")}</p>
      </div>

      {/* Hero — static band, no image layers (Syria: fast, minimal) */}
      <section className="relative overflow-hidden rounded-[var(--darlink-radius-3xl)] border border-white/5 bg-[color:var(--darlink-bg)] text-white">
        <div className="relative px-6 py-12 sm:px-10 sm:py-14 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--darlink-sand)]">{t("metaLabel")}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{t("heroSubtitle")}</p>
          <p
            className={`mt-2 text-sm font-medium text-[color:var(--darlink-sand)] ${
              publishedCount > 0 ? "text-base font-bold sm:text-lg" : ""
            }`}
          >
            {t("listingCountLine", { count: publishedCount })}
          </p>
          <div className="mt-10 max-w-2xl">
            <HeroSegmentedSearch showStaysTab={showBnhubHome} />
          </div>
          <div className="darlink-rtl-row mt-8 flex w-full flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
            <Link
              href="/buy"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--darlink-radius-xl)] border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 min-[480px]:w-auto"
            >
              {t("ctaExploreListings")}
            </Link>
            <Link
              href="/sell"
              className="hadiah-btn-primary inline-flex min-h-12 w-full min-w-[44px] items-center justify-center rounded-[var(--darlink-radius-xl)] px-6 py-3 text-sm font-semibold min-[480px]:w-auto"
            >
              {t("ctaPost")}
            </Link>
            <Link
              href="/quick-post"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--darlink-radius-xl)] border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 min-[480px]:w-auto"
            >
              {t("ctaQuickPost")}
            </Link>
            {showBnhubHome ? (
              <Link
                href="/bnhub/stays"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--darlink-radius-xl)] border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 min-[480px]:w-auto"
              >
                {t("ctaExploreStays")}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Category shortcuts */}
      <section>
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--darlink-text-muted)]">
          {t("categoryTitle")}
        </h2>
        <div className={showBnhubHome ? "mt-6 grid gap-4 sm:grid-cols-3" : "mt-6 grid gap-4 sm:grid-cols-2"}>
          <Link
            href="/buy"
            className="group rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 hover:border-[color:var(--darlink-accent)]/35"
          >
            <h3 className="text-lg font-bold text-[color:var(--darlink-text)] group-hover:text-[color:var(--darlink-gold)]">{t("sectionBuyTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("sectionBuyDesc")}</p>
          </Link>
          <Link
            href="/rent"
            className="group rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 hover:border-[color:var(--darlink-accent)]/35"
          >
            <h3 className="text-lg font-bold text-[color:var(--darlink-text)] group-hover:text-[color:var(--darlink-accent)]">{t("sectionRentTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("sectionRentDesc")}</p>
          </Link>
          {showBnhubHome ? (
            <Link
              href="/bnhub/stays"
              className="rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 hover:border-[color:var(--darlink-accent)]/30"
            >
              <h3 className="text-lg font-bold text-[color:var(--darlink-text)]">{t("sectionBnhubTitle")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("sectionBnhubDesc")}</p>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-[var(--darlink-radius-3xl)] border border-emerald-200/60 bg-gradient-to-r from-emerald-50/90 to-white px-6 py-8 text-center sm:px-10 sm:py-10">
        <h2 className="text-lg font-bold leading-snug text-[color:var(--darlink-text)] sm:text-xl">{t("growthListHookTitle")}</h2>
        <Link
          href="/quick-post"
          className="mt-5 inline-flex min-h-12 w-full min-w-0 max-w-sm items-center justify-center rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 sm:mx-auto sm:w-auto"
        >
          {t("growthListHookCta")}
        </Link>
      </section>

      {/* Latest listings (persisted in DB) */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--darlink-text)]">{t("latestListingsTitle")}</h2>
            <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">{t("latestListingsSubtitle")}</p>
          </div>
          <Link href="/buy" className="text-sm font-semibold text-[color:var(--darlink-accent)] hover:underline">
            {t("featuredViewAll")}
          </Link>
        </div>
        {latestListings.length === 0 ? (
          <Card className="border-dashed p-10 text-center text-sm text-[color:var(--darlink-text-muted)]">{t("featuredEmpty")}</Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>
        )}
      </section>

      {/* BNHub strip */}
      {bnhubOn && bnhubRows.length > 0 ? (
        <section className="rounded-[var(--darlink-radius-3xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-xl font-bold text-[color:var(--darlink-text)]">{t("bnhubFeaturedTitle")}</h2>
            <Link href="/bnhub/stays" className="text-sm font-semibold text-[color:var(--darlink-accent)] hover:underline">
              {t("bnhubViewAll")}
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{bnhubCards}</div>
        </section>
      ) : null}

      {/* How it works */}
      <section className="hadiah-below-fold rounded-[var(--darlink-radius-3xl)] bg-[color:var(--darlink-surface-muted)]/80 p-8 sm:p-10">
        <h2 className="text-center text-2xl font-bold text-[color:var(--darlink-text)]">{t("howTitle")}</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--hadiah-btn)] text-sm font-bold text-white">1</span>
            <h3 className="mt-4 font-semibold text-[color:var(--darlink-text)]">{t("how1Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("how1Body")}</p>
          </div>
          <div className="text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--hadiah-btn)] text-sm font-bold text-white">2</span>
            <h3 className="mt-4 font-semibold text-[color:var(--darlink-text)]">{t("how2Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("how2Body")}</p>
          </div>
          <div className="text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--hadiah-btn)] text-sm font-bold text-white">3</span>
            <h3 className="mt-4 font-semibold text-[color:var(--darlink-text)]">{t("how3Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("how3Body")}</p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="hadiah-below-fold border-y border-[color:var(--darlink-border)] py-10">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.15em] text-[color:var(--darlink-text-muted)]">{t("trustStripTitle")}</h2>
        <ul className="mx-auto mt-6 grid max-w-3xl gap-3 text-center text-sm text-[color:var(--darlink-text)] sm:grid-cols-2 sm:text-start sm:text-base">
          <li className="rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-3 shadow-[var(--darlink-shadow-sm)]">
            {t("trustStrip1")}
          </li>
          <li className="rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-3 shadow-[var(--darlink-shadow-sm)]">
            {t("trustStrip2")}
          </li>
          <li className="rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-3 shadow-[var(--darlink-shadow-sm)]">
            {t("trustStrip3")}
          </li>
          <li className="rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-3 shadow-[var(--darlink-shadow-sm)]">
            {t("trustStrip4")}
          </li>
        </ul>
      </section>

      {/* Bottom CTA */}
      <section className="hadiah-below-fold rounded-[var(--darlink-radius-3xl)] border border-white/5 bg-[color:var(--darlink-navy)] px-8 py-12 text-center text-white sm:px-12">
        <h2 className="text-2xl font-bold">{t("postCtaFull")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/75">{t("postCtaSub")}</p>
        <Link
          href="/sell"
          className="hadiah-btn-premium mt-8 inline-flex min-h-[44px] items-center justify-center rounded-[var(--darlink-radius-xl)] px-8 py-3 text-sm font-semibold"
        >
          {t("ctaPost")}
        </Link>
      </section>
    </div>
  );
}
