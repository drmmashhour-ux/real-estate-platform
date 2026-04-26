import Link from "next/link";

type HeroProps = {
  /** e.g. `/${locale}/${country}` for localized marketing pages */
  exploreListingsHref?: string;
  listPropertyHref?: string;
};

/**
 * High-conversion hero. Pass `exploreListingsHref` / `listPropertyHref` from the page (e.g. `base + "/listings"`).
 */
export function Hero({
  exploreListingsHref = "/listings",
  listPropertyHref = "/onboarding/broker",
}: HeroProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 text-center">
      <h1 className="text-5xl font-bold">Smarter real estate starts here</h1>

      <p className="mt-6 text-lg text-muted-foreground">
        Discover listings optimized with pricing intelligence, trust signals, and real-time demand insights.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href={exploreListingsHref}
          className="inline-flex rounded-xl bg-black px-6 py-3 text-white transition hover:bg-black/90"
        >
          Explore Listings
        </Link>

        <Link
          href={listPropertyHref}
          className="inline-flex rounded-xl border border-zinc-200 bg-background px-6 py-3 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/50"
        >
          List Your Property
        </Link>
      </div>
    </section>
  );
}
