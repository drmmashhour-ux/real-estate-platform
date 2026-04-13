"use client";

import { useState } from "react";

type SeoData = {
  title: string;
  description: string;
  headings: string[];
  keywords: string[];
  bodyPreview: string;
};

export default function SeoAiPreviewPage() {
  const [type, setType] = useState<"listing" | "area" | "blog">("area");
  const [listingId, setListingId] = useState("");
  const [city, setCity] = useState("Montreal");
  const [topic, setTopic] = useState("Top deals today");
  const [data, setData] = useState<SeoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const body =
        type === "listing" ? { type, listingId } : type === "area" ? { type, city } : { type, city, topic };
      const res = await fetch("/api/ai/seo-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Failed");
      setData(j as SeoData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-100">
      <h1 className="text-2xl font-semibold">AI SEO content preview</h1>
      <p className="mt-2 text-sm text-slate-400">Deterministic SEO output from platform data and score engines.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "listing" | "area" | "blog")}
          className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="listing">Listing</option>
          <option value="area">Area</option>
          <option value="blog">Blog</option>
        </select>
        {type === "listing" ? (
          <input
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="Listing ID"
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm sm:col-span-2"
          />
        ) : (
          <>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
            />
            {type === "blog" ? (
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic"
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
              />
            ) : (
              <div />
            )}
          </>
        )}
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-premium-gold px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      {data ? (
        <section className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5 text-sm">
          <p><strong>Title:</strong> {data.title}</p>
          <p className="mt-2"><strong>Description:</strong> {data.description}</p>
          <p className="mt-3"><strong>Headings:</strong> {data.headings.join(" | ")}</p>
          <p className="mt-2"><strong>Keywords:</strong> {data.keywords.join(", ")}</p>
          <p className="mt-3 text-slate-300">{data.bodyPreview}</p>
        </section>
      ) : null}
    </main>
  );
}
