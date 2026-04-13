import Image from "next/image";
import Link from "next/link";

/** Defaults use existing `/public/marketing` assets — replace files or edit paths for custom photography. */
const SPOTLIGHTS = [
  {
    key: "seller",
    label: "Best seller",
    caption: "Listings and trust that move serious deals.",
    href: "/sell",
    src: "/marketing/screenshots/screen-1-hero.webp",
    alt: "Spotlight: seller excellence on the platform",
  },
  {
    key: "host",
    label: "Best hosting",
    caption: "Stays and hospitality that guests remember.",
    href: "/bnhub/stays",
    src: "/marketing/bnhub-mockups/bnhub-layer-04-stay-hero.png",
    alt: "Spotlight: standout BNHUB hosting",
  },
  {
    key: "buyer",
    label: "Best buyers",
    caption: "Search, compare, and buy with clarity.",
    href: "/listings",
    src: "/marketing/screenshots/screen-2-search.webp",
    alt: "Spotlight: buyer experience and property search",
  },
] as const;

export function ProfessionalsSpotlightStrip() {
  return (
    <div className="mt-14 grid gap-6 sm:grid-cols-3">
      {SPOTLIGHTS.map(({ key, label, caption, href, src, alt }) => (
        <Link
          key={key}
          href={href}
          className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] transition hover:border-premium-gold/35 hover:shadow-lg hover:shadow-premium-gold/5"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/60">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <p className="absolute bottom-3 left-3 right-3 text-xs font-semibold uppercase tracking-wider text-premium-gold">
              {label}
            </p>
          </div>
          <div className="p-4">
            <p className="text-sm leading-relaxed text-slate-400">{caption}</p>
            <p className="mt-3 text-xs font-semibold text-premium-gold/90 group-hover:underline">Explore →</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
