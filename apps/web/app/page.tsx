import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: `${seoConfig.siteName} — Quebec real estate, marketplace & BNHub stays`,
    description: seoConfig.defaultDescription,
    path: "/",
  });
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {seoConfig.siteName}
      </h1>
      <p className="mt-4 text-balance text-slate-400">{seoConfig.defaultDescription}</p>
      <nav
        className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
        aria-label="Main hubs"
      >
        <Link
          href="/legacy-home"
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-sm font-medium text-emerald-400 hover:border-emerald-500/40 hover:text-emerald-300"
        >
          Platform overview
        </Link>
        <Link
          href="/listings"
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-sm font-medium text-emerald-400 hover:border-emerald-500/40 hover:text-emerald-300"
        >
          Property listings
        </Link>
        <Link
          href="/bnhub/stays"
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-sm font-medium text-emerald-400 hover:border-emerald-500/40 hover:text-emerald-300"
        >
          BNHub stays
        </Link>
        <Link
          href="/market"
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-sm font-medium text-emerald-400 hover:border-emerald-500/40 hover:text-emerald-300"
        >
          Market data
        </Link>
        <Link
          href="/blog"
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-sm font-medium text-emerald-400 hover:border-emerald-500/40 hover:text-emerald-300"
        >
          Blog
        </Link>
      </nav>
    </div>
  );
}
