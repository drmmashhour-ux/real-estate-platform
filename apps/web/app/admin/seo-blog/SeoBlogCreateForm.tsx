"use client";

import { useFormState } from "react-dom";
import { createSeoBlogPost, type SeoBlogActionState } from "./actions";

const initial: SeoBlogActionState = { ok: true };

export function SeoBlogCreateForm() {
  const [state, formAction] = useFormState(createSeoBlogPost, initial);

  return (
    <form action={formAction} className="mt-4 space-y-4 rounded-xl border border-white/10 bg-black/30 p-5">
      <h2 className="text-lg font-semibold text-white">New article</h2>
      {state?.ok === false && state.error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{state.error}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Slug (URL)</span>
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white"
            placeholder="montreal-buyer-guide-2026"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Publish at (local)</span>
          <input
            name="publishedAt"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-slate-400">Title</span>
        <input name="title" required className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white" />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Excerpt (optional)</span>
        <textarea name="excerpt" rows={2} className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white" />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Body (paragraphs separated by blank lines)</span>
        <textarea name="body" required rows={12} className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm text-white" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">City (optional, for hub links)</span>
          <input name="city" className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white" placeholder="Montreal" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Keywords (comma-separated)</span>
          <input name="keywords" className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white" />
        </label>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
      >
        Create &amp; edit
      </button>
    </form>
  );
}
