"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Section = {
  id: string;
  title: string;
  description: string;
  routes: string[];
  /** Optional labeled shortcuts (may overlap with routes) */
  extras?: { href: string; label: string }[];
};

function SectionBlock({ section, filter }: { section: Section; filter: string }) {
  const q = filter.trim().toLowerCase();
  const merged = useMemo(() => {
    const fromExtras = (section.extras ?? []).map((e) => ({ href: e.href, label: e.label, kind: "extra" as const }));
    const fromRoutes = section.routes.map((href) => ({ href, label: href, kind: "route" as const }));
    const seen = new Set<string>();
    const out: { href: string; label: string; kind: "extra" | "route" }[] = [];
    for (const row of [...fromExtras, ...fromRoutes]) {
      if (seen.has(row.href)) continue;
      seen.add(row.href);
      out.push(row);
    }
    return out;
  }, [section.extras, section.routes]);

  const filtered = useMemo(() => {
    if (!q) return merged;
    return merged.filter((row) => row.href.toLowerCase().includes(q) || row.label.toLowerCase().includes(q));
  }, [merged, q]);

  return (
    <details open className="rounded-xl border border-white/10 bg-black/40">
      <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-white outline-none marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-premium-gold">{section.title}</span>
        <span className="ml-2 text-xs font-normal text-slate-500">
          {filtered.length}
          {q ? ` / ${merged.length}` : ""} links
        </span>
      </summary>
      <p className="border-t border-white/5 px-4 py-2 text-xs text-slate-500">{section.description}</p>
      <ul className="max-h-[min(70vh,520px)] overflow-y-auto border-t border-white/5 px-2 py-2 text-sm">
        {filtered.map((row) => (
          <li key={row.href + row.kind}>
            <Link
              href={row.href}
              className="block rounded-md px-2 py-1.5 text-slate-300 hover:bg-white/5 hover:text-premium-gold"
            >
              {row.kind === "extra" ? (
                <>
                  <span className="font-medium text-slate-200">{row.label}</span>
                  <span className="ml-2 font-mono text-xs text-slate-500">{row.href}</span>
                </>
              ) : (
                <span className="font-mono text-xs">{row.href}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function HubAtlasView({ sections }: { sections: Section[] }) {
  const [filter, setFilter] = useState("");

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-slate-500">
          <Link href="/" className="text-premium-gold hover:underline">
            ← Home
          </Link>
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-amber-500/90">Development only</p>
        <h1 className="mt-2 text-3xl font-bold">Platform route atlas</h1>
        <p className="mt-3 text-sm text-slate-400">
          Click through every registered <code className="text-slate-300">page.tsx</code> under hubs and admin. Dashboard and{" "}
          <code className="text-slate-300">/admin</code> routes require the right sign-in and role; you may be redirected.
        </p>
        <label className="mt-6 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Filter all sections
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="e.g. finance, bnhub, kpi…"
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-premium-gold/50 focus:outline-none"
          />
        </label>
        <div className="mt-8 space-y-4">
          {sections.map((s) => (
            <SectionBlock key={s.id} section={s} filter={filter} />
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-slate-600">
          This page returns 404 in production. Paths with <code className="text-slate-500">[id]</code> are dynamic — replace with a real id when testing.
        </p>
      </div>
    </main>
  );
}
