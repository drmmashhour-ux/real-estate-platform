"use client";

import * as React from "react";

type Post = {
  id: string;
  title: string;
  content: string;
  status: string;
  slug: string;
};

export function BlogEditClient({ postId }: { postId: string }) {
  const [post, setPost] = React.useState<Post | null>(null);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetch(`/api/blog/${postId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((p: Post) => {
        setPost(p);
        setTitle(p.title);
        setContent(p.content);
        setStatus(p.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
      })
      .catch(() => setMsg("Could not load post"));
  }, [postId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Save failed");
      }
      setMsg("Saved.");
    } catch (er) {
      setMsg(er instanceof Error ? er.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (!post && !msg) return <p className="text-sm text-zinc-500">Loading…</p>;

  return (
    <form onSubmit={onSave} className="mx-auto max-w-2xl space-y-4 text-white">
      <div>
        <label className="text-xs text-zinc-500">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          required
        />
      </div>
      <p className="text-xs text-zinc-600">Slug: {post?.slug}</p>
      <div>
        <label className="text-xs text-zinc-500">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm"
          required
        />
      </div>
      <label className="text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={status === "PUBLISHED"}
          onChange={(e) => setStatus(e.target.checked ? "PUBLISHED" : "DRAFT")}
          className="mr-2"
        />
        Published
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
      {msg ? <p className="text-sm text-zinc-400">{msg}</p> : null}
    </form>
  );
}
