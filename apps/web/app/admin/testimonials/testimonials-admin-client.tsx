"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  role: string | null;
  city: string | null;
  quote: string;
  rating: number;
  image: string | null;
  featured: boolean;
  isApproved: boolean;
  createdAt: string;
};

export function TestimonialsAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [image, setImage] = useState("");
  const [featuredNew, setFeaturedNew] = useState(false);
  const [approvedNew, setApprovedNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/testimonials", { credentials: "same-origin" });
    if (!res.ok) {
      setError("Could not load");
      setRows([]);
    } else {
      setRows(await res.json());
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/testimonials", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        quote,
        role: role || null,
        city: city || null,
        rating,
        image: image || null,
        featured: featuredNew,
        isApproved: approvedNew,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Create failed");
      return;
    }
    setName("");
    setQuote("");
    setRole("");
    setCity("");
    setImage("");
    setRating(5);
    setFeaturedNew(false);
    setApprovedNew(false);
    load();
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) alert("Update failed");
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE", credentials: "same-origin" });
    if (!res.ok) alert("Delete failed");
    else load();
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Testimonials</h1>
        <p className="mt-1 text-sm text-slate-400">
          Approve and feature quotes for the homepage. Only approved + featured items show in “What clients say” (top
          3 featured).
        </p>

        <form
          onSubmit={create}
          className="mt-8 space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <h2 className="text-lg font-medium text-slate-200">New testimonial</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name *"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (e.g. Seller)"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Rating</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Quote *"
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            required
          />
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Image URL (optional)"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={featuredNew} onChange={(e) => setFeaturedNew(e.target.checked)} />
              Featured (homepage)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={approvedNew} onChange={(e) => setApprovedNew(e.target.checked)} />
              Approved (public)
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            Create
          </button>
        </form>

        {error ? <p className="mt-6 text-red-400">{error}</p> : null}
        {loading ? (
          <p className="mt-8 text-slate-500">Loading…</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Quote</th>
                  <th className="px-3 py-2">★</th>
                  <th className="px-3 py-2">Approved</th>
                  <th className="px-3 py-2">Featured</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/80">
                    <td className="px-3 py-2 text-slate-200">{r.name}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-slate-400">{r.quote}</td>
                    <td className="px-3 py-2">{r.rating}</td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={r.isApproved}
                        onChange={(e) => patch(r.id, { isApproved: e.target.checked })}
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
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        className="text-red-400 hover:underline"
                      >
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
