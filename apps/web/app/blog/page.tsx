import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { getBlogIndexRows } from "@/lib/content/merged-blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Buying guides, rental trends, investment analysis, and mortgage tips — with links to local SEO hubs and platform tools.",
  openGraph: {
    title: `${PLATFORM_NAME} blog`,
    description: "Guides for buyers, renters, and investors in Quebec and beyond.",
  },
  robots: { index: true, follow: true },
};

export const revalidate = 600;

export default async function BlogIndexPage() {
  const rows = await getBlogIndexRows();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C9A646]">Blog</p>
        <h1 className="mt-3 text-4xl font-bold">Growth & market guides</h1>
        <p className="mt-3 text-white/70">
          Articles link to our city landings (<Link href="/buy/montreal" className="text-[#C9A646] hover:underline">/buy</Link>,{" "}
          <Link href="/rent/laval" className="text-[#C9A646] hover:underline">/rent</Link>,{" "}
          <Link href="/mortgage/quebec" className="text-[#C9A646] hover:underline">/mortgage</Link>) and tools like{" "}
          <Link href="/tools/roi-calculator" className="text-[#C9A646] hover:underline">
            ROI calculator
          </Link>
          .
        </p>
        <ul className="mt-10 space-y-6">
          {rows.map((post) => (
            <li
              key={post.slug}
              className="rounded-2xl border border-white/10 bg-[#111] p-6 transition hover:border-[#C9A646]/40"
            >
              <Link href={`/blog/${post.slug}`} className="group block">
                <time dateTime={post.publishedAt.toISOString()} className="text-xs text-white/50">
                  {post.publishedAt.toISOString().slice(0, 10)}
                </time>
                <h2 className="mt-2 text-xl font-semibold text-white group-hover:text-[#C9A646]">{post.title}</h2>
                <p className="mt-2 text-sm text-white/70">{post.description}</p>
                <span className="mt-3 inline-block text-sm font-medium text-[#C9A646]">Read →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
