"use client";

import { useState } from "react";

export function KnowledgeLibraryPage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"law" | "drafting" | "internal">("law");
  const [fileUrl, setFileUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [lastChunkCount, setLastChunkCount] = useState<number | null>(null);

  async function upload() {
    const res = await fetch("/api/knowledge/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, fileUrl, rawText }),
    });
    const json = await res.json().catch(() => ({}));
    setLastChunkCount(typeof json.chunkCount === "number" ? json.chunkCount : null);
    setRawText("");
  }

  async function search() {
    const res = await fetch(`/api/knowledge/search?query=${encodeURIComponent(query)}`);
    const json = await res.json();
    setResults(json.results ?? []);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">Upload knowledge document</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input className="rounded-md bg-black/40 p-2 text-xs text-white" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="rounded-md bg-black/40 p-2 text-xs text-white" placeholder="File URL" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
          <select className="rounded-md bg-black/40 p-2 text-xs text-white" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="law">Law</option><option value="drafting">Drafting</option><option value="internal">Internal</option>
          </select>
        </div>
        <textarea className="mt-2 w-full rounded-md bg-black/40 p-2 text-xs text-white" rows={5} placeholder="Paste extracted text" value={rawText} onChange={(e) => setRawText(e.target.value)} />
        <button type="button" onClick={upload} className="mt-2 rounded-md bg-premium-gold px-3 py-2 text-xs font-medium text-black">Upload + Process</button>
        {lastChunkCount != null ? <p className="mt-2 text-xs text-emerald-200/90">Processed {lastChunkCount} tagged chunks (500–1000 token budget).</p> : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">Knowledge search</p>
        <div className="mt-2 flex gap-2">
          <input className="flex-1 rounded-md bg-black/40 p-2 text-xs text-white" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search knowledge" />
          <button type="button" onClick={search} className="rounded-md border border-white/20 px-3 py-2 text-xs text-white">Search</button>
        </div>
        <div className="mt-3 space-y-2">
          {results.map((r) => (
            <div key={r.chunkId} className="rounded-md bg-white/5 p-2 text-xs text-slate-200">
              <p className="text-[10px] text-slate-400">
                {r.source?.title} · p.{r.pageNumber ?? "—"} · {r.chunkType ?? "?"} · {r.audience ?? "?"} · {r.importance ?? "?"}
              </p>
              <p className="mt-1">{r.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
