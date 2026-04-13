import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export const dynamic = "force-dynamic";

const PATH = "/listings/saved";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  const base = getSiteBaseUrl();
  return buildPageMetadata({
    title: `Saved listings | ${seoConfig.siteName}`,
    description: `Revisit properties you saved on ${seoConfig.siteName}. Sign in to sync favorites across sessions.`,
    path: PATH,
    locale,
    country,
    ogImage: `${base}/brand/lecipm-mark-on-dark.svg`,
  });
}

function firstImage(images: unknown, cover: string | null): string | null {
  if (cover) return cover;
  if (!Array.isArray(images)) return null;
  for (const p of images) {
    if (typeof p === "string") return p;
  }
  return null;
}

export default async function SavedListingsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=%2Flistings%2Fsaved");

  const saved = await prisma.buyerSavedListing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      fsboListing: {
        select: {
          id: true,
          title: true,
          city: true,
          priceCents: true,
          coverImage: true,
          images: true,
          propertyType: true,
          status: true,
          moderationStatus: true,
          archivedAt: true,
          expiresAt: true,
        },
      },
    },
  });

  const rows = saved
    .map((s) => s.fsboListing)
    .filter((l) => isFsboPubliclyVisible(l))
    .map((l) => ({
      ...l,
      href: buildFsboPublicListingPath({
        id: l.id,
        city: l.city,
        propertyType: l.propertyType,
      }),
    }));

  return (
    <div className="min-h-screen bg-brand-background px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saved listings</h1>
            <p className="mt-2 text-sm text-white/70">Properties you saved while signed in.</p>
          </div>
          <Link
            href="/listings"
            className="text-sm font-semibold text-premium-gold transition hover:underline"
          >
            Browse all listings →
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="mt-12 text-center text-sm text-white/60">
            No saved listings yet. Tap “Save” on a property to add it here.
          </p>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((l) => {
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
                        {price} · {l.city}
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
