"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function BlogComposerClient({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMsg("Saved.");
      if (data.id) router.push(`${basePath}/blog/${data.id}`);
    } catch (er) {
      setMsg(er instanceof Error ? er.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-4 text-white">
      <div>
        <label className="text-xs text-zinc-500">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm"
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={status === "PUBLISHED"}
            onChange={(e) => setStatus(e.target.checked ? "PUBLISHED" : "DRAFT")}
            className="mr-2"
          />
          Publish immediately
        </label>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {msg ? <p className="text-sm text-zinc-400">{msg}</p> : null}
    </form>
  );
}
