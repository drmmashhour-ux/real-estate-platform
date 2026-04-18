"use client";

import * as React from "react";
import Link from "next/link";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
};

export function BlogDashboardClient({
  locale,
  country,
  marketingBlogPrefix,
}: {
  locale: string;
  country: string;
  marketingBlogPrefix: string;
}) {
  const [posts, setPosts] = React.useState<PostRow[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const base = `/${locale}/${country}/dashboard`;

  React.useEffect(() => {
    void fetch("/api/blog")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((d: { posts: PostRow[] }) => setPosts(d.posts ?? []))
      .catch(() => setErr("Could not load posts"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          User-owned posts (separate from SEO admin blog). Public URL:{" "}
          <code className="text-xs text-emerald-300">
            {marketingBlogPrefix}/marketing-blog/[slug]
          </code>
        </p>
        <Link
          href={`${base}/blog/new`}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          New post
        </Link>
      </div>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div>
              <span className="font-medium">{p.title}</span>
              <span className="ml-2 text-xs text-zinc-500">{p.status}</span>
            </div>
            <Link href={`${base}/blog/${p.id}`} className="text-sm text-emerald-400 hover:underline">
              Edit
            </Link>
          </li>
        ))}
      </ul>
      {!loading && posts.length === 0 ? <p className="text-sm text-zinc-500">No posts yet.</p> : null}
    </div>
  );
}
