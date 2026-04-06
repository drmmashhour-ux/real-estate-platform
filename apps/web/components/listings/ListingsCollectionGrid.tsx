import Image from "next/image";
import Link from "next/link";
import type { FsboCollectionCard } from "@/lib/listings/fsbo-collection-queries";
import { ShareListingActions } from "@/components/sharing/ShareListingActions";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

function firstImage(images: unknown, cover: string | null): string | null {
  if (cover) return cover;
  if (!Array.isArray(images)) return null;
  for (const p of images) {
    if (typeof p === "string") return p;
  }
  return null;
}

export function ListingsCollectionGrid({
  title,
  subtitle,
  items,
  canonicalPath,
}: {
  title: string;
  subtitle: string;
  items: FsboCollectionCard[];
  canonicalPath: string;
}) {
  const base = getSiteBaseUrl();
  return (
    <div className="min-h-screen bg-brand-background px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">{subtitle}</p>
          </div>
          <ShareListingActions
            shareTitle={title}
            shareText={subtitle}
            url={`${base}${canonicalPath}`}
          />
        </div>

        {items.length === 0 ? (
          <p className="mt-12 text-center text-sm text-white/60">No public listings match this collection right now.</p>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => {
              const src = firstImage(l.images, l.coverImage);
              const price = l.priceCents ? `$${Math.round(l.priceCents / 100).toLocaleString("en-CA")}` : "—";
              return (
                <li key={l.id}>
                  <Link
                    href={l.href}
                    className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#111] transition hover:border-premium-gold/35"
                  >
                    <div className="relative aspect-[4/3] bg-[#1a1a1a]">
                      {src ? (
                        src.startsWith("/") ? (
                          <Image
                            src={src}
                            alt={l.title}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-[1.03]"
                            sizes="(max-width:768px) 100vw, 33vw"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={l.title}
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                            decoding="async"
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#222] to-[#0a0a0a]" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 font-semibold text-white">{l.title}</p>
                      <p className="mt-1 text-sm text-premium-gold">
                        {price}
                        {l.bedrooms != null ? ` · ${l.bedrooms} bd` : ""} · {l.city}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
