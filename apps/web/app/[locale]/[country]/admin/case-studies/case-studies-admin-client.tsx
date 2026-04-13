"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  title: string;
  city: string | null;
  summary: string;
  featured: boolean;
  isPublished: boolean;
  createdAt: string;
};

export function CaseStudiesAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [summary, setSummary] = useState("");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [result, setResult] = useState("");
  const [image, setImage] = useState("");
  const [featuredNew, setFeaturedNew] = useState(false);
  const [publishedNew, setPublishedNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/case-studies", { credentials: "same-origin" });
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/case-studies", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        city: city || null,
        summary,
        challenge,
        solution,
        result,
        image: image || null,
        featured: featuredNew,
        isPublished: publishedNew,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Create failed");
      return;
    }
    setTitle("");
    setCity("");
    setSummary("");
    setChallenge("");
    setSolution("");
    setResult("");
    setImage("");
    setFeaturedNew(false);
    setPublishedNew(false);
    load();
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/case-studies/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) alert("Update failed");
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this case study?")) return;
    const res = await fetch(`/api/admin/case-studies/${id}`, { method: "DELETE", credentials: "same-origin" });
    if (!res.ok) alert("Delete failed");
    else load();
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Case studies</h1>
        <p className="mt-1 text-sm text-slate-400">
          Publish outcome stories for /case-studies. Mark one as featured for the hero.
        </p>

        <form
          onSubmit={create}
          className="mt-8 space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <h2 className="text-lg font-medium text-slate-200">New case study</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Title *"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            placeholder="Summary *"
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <textarea
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            required
            placeholder="Challenge *"
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            required
            placeholder="Solution / approach *"
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            required
            placeholder="Result *"
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Image URL (optional, prefer /images/... paths)"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={featuredNew} onChange={(e) => setFeaturedNew(e.target.checked)} />
              Featured (hero)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={publishedNew} onChange={(e) => setPublishedNew(e.target.checked)} />
              Published (public)
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            Create
          </button>
        </form>

        {loading ? (
          <p className="mt-8 text-slate-500">Loading…</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Published</th>
                  <th className="px-3 py-2">Featured</th>
                  <th className="px-3 py-2">Link</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/80">
                    <td className="px-3 py-2 text-slate-200">{r.title}</td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={r.isPublished}
                        onChange={(e) => patch(r.id, { isPublished: e.target.checked })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={r.featured}
                        onChange={(e) => patch(r.id, { featured: e.target.checked })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/case-studies/${r.id}`} className="text-amber-400 hover:underline" target="_blank">
                        View
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => remove(r.id)} className="text-red-400 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
