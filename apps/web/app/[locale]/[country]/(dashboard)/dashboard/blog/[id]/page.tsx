import Link from "next/link";
import { engineFlags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { BlogEditClient } from "@/components/blog/BlogEditClient";

export const dynamic = "force-dynamic";

export default async function DashboardBlogEditPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  await requireAuthenticatedUser();
  const { locale, country, id } = await params;
  const base = `/${locale}/${country}/dashboard`;

  if (!engineFlags.blogSystemV1) {
    return (
      <div className="p-6 text-white">
        <p className="text-sm text-zinc-400">Blog system disabled.</p>
        <Link href={base} className="mt-4 inline-block text-emerald-400">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-white">
      <Link href={`${base}/blog`} className="text-sm text-emerald-400 hover:underline">
        ← All posts
      </Link>
      <h1 className="text-2xl font-bold">Edit post</h1>
      <BlogEditClient postId={id} />
    </div>
  );
}
