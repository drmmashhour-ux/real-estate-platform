import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPlatformFeatureSlugs,
  getPlatformFeatureBySlug,
} from "@/lib/marketing/platform-features";
import { platformBrandGoldTextClass } from "@/config/branding";
import { marketingType } from "@/config/typography";
import { PLATFORM_NAME } from "@/lib/brand/platform";

type Props = { params: Promise<{ slug: string }> };

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export function generateStaticParams() {
  return getAllPlatformFeatureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = getPlatformFeatureBySlug(slug);
  if (!f) return { title: "Feature" };
  const title = `${f.title} | ${PLATFORM_NAME}`;
  const description = [f.description, f.intro].join(" ").slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(siteUrl ? { url: `${siteUrl}/features/${slug}` } : {}),
    },
  };
}

export default async function PlatformFeaturePage({ params }: Props) {
  const { slug } = await params;
  const f = getPlatformFeatureBySlug(slug);
  if (!f) notFound();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${platformBrandGoldTextClass}`}>
          Platform pillar
        </p>
        <h1 className={`${marketingType.sectionTitle} text-white`}>{f.title}</h1>
        <p className="mt-4 border-l-2 border-[#C9A646]/60 pl-4 text-sm font-medium leading-relaxed text-[#E8D5A0] sm:text-base">
          {f.description}
        </p>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#B3B3B3] sm:text-lg">{f.intro}</p>

        <div className="mt-8 space-y-5 border-t border-white/10 pt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Overview</h2>
          {f.detailParagraphs.map((p, i) => (
            <p key={i} className="max-w-2xl text-sm leading-relaxed text-[#C9C9C9] sm:text-base">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">What you get</h2>
          <ul className="mt-6 space-y-4">
          {f.bullets.map((b) => (
            <li key={b} className="flex gap-3 text-sm leading-relaxed text-[#E5E5E5]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A646]" aria-hidden />
              {b}
            </li>
          ))}
          </ul>
        </div>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-white/10 pt-10">
          <Link
            href="/#features"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#C9A646]/40 hover:text-[#C9A646]"
          >
            ← All features
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-[#C9A646] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#C9A227]"
          >
            Talk to us
          </Link>
        </div>
      </article>
    </div>
  );
}
