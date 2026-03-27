import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

type Props = { params: Promise<{ token: string }> };

function resolvePath(link: { resourceType: string; resourceKey: string }): string | null {
  if (link.resourceType === "listing_analysis") {
    const parts = link.resourceKey.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const listingId = parts[parts.length - 1]!;
      const city = parts[parts.length - 2]!;
      return `/analysis/${city}/${listingId}`;
    }
  }
  if (link.resourceType === "market") {
    return `/market/${link.resourceKey}`;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const base = getSiteBaseUrl();
  const link = await prisma.publicShareLink.findUnique({ where: { token } });
  if (!link) return { title: "Share" };
  const title = link.title ?? "Property insights | LECIPM";
  const desc = link.summaryLine ?? "Trust and deal context — not financial advice.";
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
      url: `${base}/share/${token}`,
      images: [{ url: `${base}/api/og/share/${token}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

export default async function ShareLandingPage({ params }: Props) {
  const { token } = await params;
  const link = await prisma.publicShareLink.findUnique({ where: { token } });
  if (!link) notFound();

  await prisma.publicShareLink.update({
    where: { id: link.id },
    data: { clickCount: { increment: 1 } },
  });
  await prisma.shareClickEvent.create({ data: { shareLinkId: link.id } });

  const path = resolvePath(link);

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Shared via LECIPM</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
        {link.title ?? "Property analysis"}
      </h1>
      {link.summaryLine ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{link.summaryLine}</p>
      ) : null}
      {(link.trustScoreHint != null || link.dealScoreHint != null) && (
        <p className="mt-6 text-sm text-slate-700 dark:text-slate-300">
          {link.trustScoreHint != null ? <>Trust hint: {link.trustScoreHint}</> : null}
          {link.trustScoreHint != null && link.dealScoreHint != null ? " · " : null}
          {link.dealScoreHint != null ? <>Deal hint: {link.dealScoreHint}</> : null}
        </p>
      )}
      {path ? (
        <Link
          href={path}
          className="mt-10 inline-flex rounded-xl bg-[#C9A646] px-6 py-3 text-sm font-semibold text-black hover:bg-[#E8C547]"
        >
          Open full analysis
        </Link>
      ) : (
        <p className="mt-10 text-sm text-slate-500">Destination not available.</p>
      )}
      <p className="mt-8 text-xs text-slate-500">Illustrative scores — not financial advice.</p>
    </main>
  );
}
