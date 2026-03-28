"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { deleteSeoBlogPost, updateSeoBlogPost, type SeoBlogActionState } from "./actions";

const initial: SeoBlogActionState = { ok: true };

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SeoBlogEditForm({
  post,
  created,
}: {
  post: {
    id: string;
    slug: string;
    title: string;
    body: string;
    excerpt: string | null;
    city: string | null;
    keywords: string[];
    publishedAt: Date;
  };
  created?: boolean;
}) {
  const [state, formAction] = useFormState(updateSeoBlogPost, initial);

  return (
    <div className="space-y-6">
      {created ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Article created. Public URL:{" "}
          <Link href={`/blog/${post.slug}`} className="font-medium underline">
            /blog/{post.slug}
          </Link>
        </p>
      ) : null}
      {state?.saved ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Saved.</p>
      ) : null}
      {state?.ok === false && state.error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{state.error}</p>
      ) : null}

      <form action={formAction} className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-5">
        <input type="hidden" name="id" value={post.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-400">Slug</span>
            <input
              name="slug"
              required
              defaultValue={post.slug}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Publish at</span>
            <input
              name="publishedAt"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(new Date(post.publishedAt))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-400">Title</span>
          <input name="title" required defaultValue={post.title} className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Excerpt</span>
          <textarea name="excerpt" rows={2} defaultValue={post.excerpt ?? ""} className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Body</span>
          <textarea name="body" required rows={14} defaultValue={post.body} className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm text-white" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-400">City</span>
            <input name="city" defaultValue={post.city ?? ""} className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Keywords</span>
            <input name="keywords" defaultValue={post.keywords.join(", ")} className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white" />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90">
            Save changes
          </button>
          <Link href="/blog" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/5">
            View blog index
          </Link>
        </div>
      </form>

      <form action={deleteSeoBlogPost} className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <input type="hidden" name="id" value={post.id} />
        <p className="text-sm text-red-200/90">Delete permanently (public URL will 404).</p>
        <button type="submit" className="mt-3 rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10">
          Delete article
        </button>
      </form>
    </div>
  );
}
