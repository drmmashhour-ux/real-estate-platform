import Link from "next/link";
import { engineFlags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { BlogComposerClient } from "@/components/blog/BlogComposerClient";

export const dynamic = "force-dynamic";

export default async function DashboardBlogNewPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  await requireAuthenticatedUser();
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;

  if (!engineFlags.blogSystemV1) {
    return (
      <div className="p-6 text-white">
        <p className="text-sm text-zinc-400">Blog system disabled.</p>
        <Link href={`${base}/blog`} className="mt-4 inline-block text-emerald-400">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-white">
      <Link href={`${base}/blog`} className="text-sm text-emerald-400 hover:underline">
        ← All posts
      </Link>
      <h1 className="text-2xl font-bold">New post</h1>
      <BlogComposerClient basePath={base} />
    </div>
  );
}
