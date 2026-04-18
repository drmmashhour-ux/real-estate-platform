import { engineFlags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { BlogDashboardClient } from "@/components/blog/BlogDashboardClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardBlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  await requireAuthenticatedUser();
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;
  const marketingBlogPrefix = `/${locale}/${country}`;

  if (!engineFlags.blogSystemV1) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 text-white">
        <h1 className="text-2xl font-bold">Blog</h1>
        <p className="text-sm text-zinc-400">
          The user blog engine is disabled. Set <code className="rounded bg-zinc-800 px-1">FEATURE_BLOG_SYSTEM_V1=true</code>{" "}
          to enable.
        </p>
        <Link href={base} className="text-sm text-emerald-400 hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-white">
      <div>
        <h1 className="text-2xl font-bold">Marketing blog</h1>
        <p className="mt-1 text-sm text-zinc-500">Drafts and published posts for your growth content engine (v2).</p>
      </div>
      <BlogDashboardClient locale={locale} country={country} marketingBlogPrefix={marketingBlogPrefix} />
    </div>
  );
}
