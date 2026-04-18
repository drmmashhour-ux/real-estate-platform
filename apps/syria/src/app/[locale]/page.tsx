import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { HeroSegmentedSearch } from "@/components/HeroSegmentedSearch";
import { HomeGrowthBeacon } from "@/components/HomeGrowthBeacon";
import { syriaFlags } from "@/lib/platform-flags";
import { Card } from "@/components/ui/Card";

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  const featured = await prisma.syriaProperty.findMany({
    where: { status: "PUBLISHED", fraudFlag: false },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 6,
  });

  const bnhubRows =
    syriaFlags.BNHUB_ENABLED
      ? await prisma.syriaProperty.findMany({
          where: { type: "BNHUB", status: "PUBLISHED", fraudFlag: false },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: 4,
        })
      : [];

  const cards =
    featured.length > 0
      ? featured.map((l, i) => <ListingCard key={l.id} listing={l} locale={locale} priority={i < 3} />)
      : null;

  const bnhubCards =
    bnhubRows.length > 0 ? bnhubRows.map((l) => <ListingCard key={l.id} listing={l} locale={locale} />) : null;

  return (
    <div className="space-y-16 sm:space-y-20">
      <HomeGrowthBeacon />

      {/* Hero — navy band, natural RTL flow */}
      <section className="relative overflow-hidden rounded-[var(--darlink-radius-3xl)] bg-[color:var(--darlink-bg)] text-white shadow-[var(--darlink-shadow-xl)]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(ellipse 80% 60% at 100% 0%, rgb(214 195 161 / 0.35), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgb(31 122 92 / 0.25), transparent 50%)",
          }}
        />
        <div className="relative px-6 py-14 sm:px-10 sm:py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--darlink-sand)]">{t("metaLabel")}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{t("heroSubtitle")}</p>
          <div className="mt-10 max-w-2xl">
            <HeroSegmentedSearch />
          </div>
          <div className="darlink-rtl-row mt-8 flex flex-wrap gap-3">
            <Link
              href="/buy"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--darlink-radius-xl)] border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              {t("ctaExploreListings")}
            </Link>
            <Link
              href="/sell"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--darlink-radius-xl)] bg-[color:var(--darlink-accent)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--darlink-shadow-md)] transition hover:opacity-[0.96]"
            >
              {t("ctaPost")}
            </Link>
            <Link
              href="/bnhub/stays"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--darlink-radius-xl)] border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              {t("ctaExploreStays")}
            </Link>
          </div>
        </div>
      </section>

      {/* Category shortcuts */}
      <section>
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--darlink-text-muted)]">
          {t("categoryTitle")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link
            href="/buy"
            className="group rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)] transition hover:border-[color:var(--darlink-accent)]/40 hover:shadow-[var(--darlink-shadow-md)]"
          >
            <h3 className="text-lg font-bold text-[color:var(--darlink-text)] group-hover:text-[color:var(--darlink-accent)]">{t("sectionBuyTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("sectionBuyDesc")}</p>
          </Link>
          <Link
            href="/rent"
            className="group rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)] transition hover:border-[color:var(--darlink-accent)]/40 hover:shadow-[var(--darlink-shadow-md)]"
          >
            <h3 className="text-lg font-bold text-[color:var(--darlink-text)] group-hover:text-[color:var(--darlink-accent)]">{t("sectionRentTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("sectionRentDesc")}</p>
          </Link>
          <Link
            href="/bnhub/stays"
            className="group rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)] transition hover:border-[color:var(--darlink-accent)]/40 hover:shadow-[var(--darlink-shadow-md)]"
          >
            <h3 className="text-lg font-bold text-[color:var(--darlink-text)] group-hover:text-[color:var(--darlink-accent)]">{t("sectionBnhubTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("sectionBnhubDesc")}</p>
          </Link>
        </div>
      </section>

      {/* Featured */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--darlink-text)]">{t("featuredTitle")}</h2>
            <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">{t("featuredSubtitle")}</p>
          </div>
          <Link href="/buy" className="text-sm font-semibold text-[color:var(--darlink-accent)] hover:underline">
            {t("featuredViewAll")}
          </Link>
        </div>
        {featured.length === 0 ? (
          <Card className="border-dashed p-10 text-center text-sm text-[color:var(--darlink-text-muted)]">{t("featuredEmpty")}</Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>
        )}
      </section>

      {/* BNHub strip */}
      {syriaFlags.BNHUB_ENABLED && bnhubRows.length > 0 ? (
        <section className="rounded-[var(--darlink-radius-3xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)] sm:p-8">
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
      <section className="rounded-[var(--darlink-radius-3xl)] bg-[color:var(--darlink-surface-muted)]/80 p-8 sm:p-10">
        <h2 className="text-center text-2xl font-bold text-[color:var(--darlink-text)]">{t("howTitle")}</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color:var(--darlink-accent)] text-sm font-bold text-white">1</span>
            <h3 className="mt-4 font-semibold text-[color:var(--darlink-text)]">{t("how1Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("how1Body")}</p>
          </div>
          <div className="text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color:var(--darlink-accent)] text-sm font-bold text-white">2</span>
            <h3 className="mt-4 font-semibold text-[color:var(--darlink-text)]">{t("how2Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("how2Body")}</p>
          </div>
          <div className="text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color:var(--darlink-accent)] text-sm font-bold text-white">3</span>
            <h3 className="mt-4 font-semibold text-[color:var(--darlink-text)]">{t("how3Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--darlink-text-muted)]">{t("how3Body")}</p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-[color:var(--darlink-border)] py-10">
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
      <section className="rounded-[var(--darlink-radius-3xl)] bg-[color:var(--darlink-navy)] px-8 py-12 text-center text-white shadow-[var(--darlink-shadow-lg)] sm:px-12">
        <h2 className="text-2xl font-bold">{t("postCtaFull")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/75">{t("postCtaSub")}</p>
        <Link
          href="/sell"
          className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-[var(--darlink-radius-xl)] bg-[color:var(--darlink-accent)] px-8 py-3 text-sm font-semibold text-white hover:opacity-[0.96]"
        >
          {t("ctaPost")}
        </Link>
      </section>
    </div>
  );
}
