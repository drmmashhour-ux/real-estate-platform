"use client";

import { useMemo, useState } from "react";
import {
  INVESTOR_QA,
  investorQACategories,
  type InvestorQAItem,
} from "@/modules/investor/investor-qa";

const GOLD = "var(--color-premium-gold)";

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function matchesSearch(item: InvestorQAItem, q: string) {
  if (!q) return true;
  const n = normalize(q);
  return normalize(item.question).includes(n) || normalize(item.answer).includes(n);
}

function filterQA(tab: string, query: string): InvestorQAItem[] {
  return INVESTOR_QA.filter((item) => {
    if (tab !== "All" && item.category !== tab) return false;
    return matchesSearch(item, query);
  });
}

function pruneOpen(nextFiltered: InvestorQAItem[], prev: Set<string>): Set<string> {
  const next = new Set<string>();
  for (const id of prev) {
    if (nextFiltered.some((f) => f.id === id)) next.add(id);
  }
  if (next.size === 0 && nextFiltered[0]) next.add(nextFiltered[0].id);
  return next;
}

function AnswerBody({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-400 sm:text-[15px]">
      {parts.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}

export function InvestorQA() {
  const categories = useMemo(() => ["All", ...investorQACategories(INVESTOR_QA)], []);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() =>
    INVESTOR_QA[0] ? new Set([INVESTOR_QA[0].id]) : new Set(),
  );

  const filtered = useMemo(() => filterQA(tab, query), [tab, query]);

  const toggle = (id: string) => {
    setOpen((prev) => {
      if (!allowMultiple) {
        if (prev.has(id) && prev.size === 1) return new Set();
        return new Set([id]);
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isExpanded = (id: string) => open.has(id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block flex-1">
          <span className="sr-only">Search questions</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              const q = e.target.value;
              setQuery(q);
              setOpen((prev) => pruneOpen(filterQA(tab, q), prev));
            }}
            placeholder="Search questions or answers…"
            className="w-full rounded-2xl border border-white/10 bg-black/50 py-3 pl-4 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-premium-gold/50 focus:ring-2 focus:ring-premium-gold/20"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => {
              const multi = e.target.checked;
              setAllowMultiple(multi);
              if (!multi) {
                setOpen((prev) => {
                  const first = [...prev][0];
                  const f = filterQA(tab, query);
                  return first ? new Set([first]) : new Set(f[0] ? [f[0].id] : []);
                });
              }
            }}
            className="rounded border-white/20 bg-black text-premium-gold focus:ring-premium-gold"
          />
          Allow multiple open
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setTab(c);
              setOpen((prev) => pruneOpen(filterQA(c, query), prev));
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              tab === c ? "text-black" : "border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
            }`}
            style={tab === c ? { background: GOLD } : undefined}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-500">
          No questions match your search. Try another keyword or category.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const expanded = isExpanded(item.id);
            return (
              <li key={item.id}>
                <div
                  className={`overflow-hidden rounded-2xl border transition ${
                    expanded ? "border-premium-gold/35 bg-premium-gold/[0.06]" : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-expanded={expanded}
                    className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left sm:px-6 sm:py-5"
                  >
                    <span className="min-w-0">
                      {item.category ? (
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-premium-gold/90">
                          {item.category}
                        </span>
                      ) : null}
                      <span className="text-base font-bold leading-snug text-white sm:text-lg">{item.question}</span>
                    </span>
                    <span
                      className="shrink-0 text-xl font-light leading-none"
                      style={{ color: expanded ? GOLD : "#64748b" }}
                      aria-hidden
                    >
                      {expanded ? "−" : "+"}
                    </span>
                  </button>
                  {expanded ? (
                    <div className="border-t border-white/10 px-5 pb-6 pt-0 sm:px-6">
                      <AnswerBody text={item.answer} />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
