"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

const SECTION_ORDER = [
  "problem",
  "solution",
  "product",
  "market",
  "business_model",
  "traction",
  "growth",
  "financials",
  "vision",
  "ask",
  "title",
  "other",
];

function normalizeType(t: string): string {
  const x = t.toLowerCase().trim();
  if (SECTION_ORDER.includes(x)) return x;
  return "other";
}

function contentToText(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

export function InvestorPitchViewer({
  deck,
}: {
  deck: {
    title: string;
    createdAtLabel: string;
    slides: Array<{ order: number; type: string; title: string; content: unknown }>;
  } | null;
}) {
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copy:", text);
    }
  }, []);

  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (!deck || deck.slides.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-500">
        <p>No pitch deck yet.</p>
        <Link href="/admin/pitch-deck" className="mt-4 inline-block text-amber-400 hover:text-amber-300">
          Open pitch deck generator →
        </Link>
      </div>
    );
  }

  const grouped = new Map<string, typeof deck.slides>();
  for (const s of deck.slides) {
    const key = normalizeType(s.type);
    const list = grouped.get(key) ?? [];
    list.push(s);
    grouped.set(key, list);
  }

  const keys = [...SECTION_ORDER.filter((k) => grouped.has(k)), ...[...grouped.keys()].filter((k) => !SECTION_ORDER.includes(k))];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-zinc-950 to-black p-6">
        <h1 className="font-serif text-2xl text-amber-100">{deck.title}</h1>
        <p className="mt-1 text-xs text-zinc-500">{deck.createdAtLabel}</p>
        <Link href="/admin/pitch-deck" className="mt-4 inline-block text-sm text-amber-400/90 hover:text-amber-300">
          Edit in generator →
        </Link>
      </div>

      {keys.map((section) => {
        const slides = grouped.get(section) ?? [];
        const isOpen = open[section] !== false;
        return (
          <section key={section} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [section]: !isOpen }))}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-amber-500/90">
                {section.replace(/_/g, " ")}
              </span>
              <span className="text-zinc-500">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <ul className="space-y-4 border-t border-zinc-900 px-5 py-4">
                {slides.map((s) => {
                  const body = contentToText(s.content);
                  const block = `## ${s.title}\n\n${body}`;
                  return (
                    <li key={`${s.order}-${s.title}`} className="rounded-xl border border-zinc-800/60 bg-black/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase text-zinc-600">Slide {s.order}</span>
                          <h3 className="mt-1 font-medium text-amber-50">{s.title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => void copy(block)}
                          className="text-xs text-amber-400/90 hover:underline"
                        >
                          Copy slide
                        </button>
                      </div>
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-black/50 p-3 text-xs text-zinc-400">
                        {body}
                      </pre>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
