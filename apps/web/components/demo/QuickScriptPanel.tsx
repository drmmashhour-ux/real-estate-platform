"use client";

import { useCallback, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, MessageSquareQuote, X } from "lucide-react";
import type { BrokerObjection, DemoScriptBlock } from "./objections-data";

type Tab = "script" | "objections";

export type QuickScriptPanelProps = {
  scriptBlocks: DemoScriptBlock[];
  objections: BrokerObjection[];
  /** Optional: anchor prefix for scroll targets (default #) */
  scrollOffsetPx?: number;
};

function scrollToId(elementId: string, offsetPx: number) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offsetPx;
  window.scrollTo({ top, behavior: "smooth" });
}

/**
 * Floating quick access: demo script + objections, clickable to jump on the page.
 */
export function QuickScriptPanel({ scriptBlocks, objections, scrollOffsetPx = 96 }: QuickScriptPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("script");
  const [expandedScriptId, setExpandedScriptId] = useState<string | null>(scriptBlocks[0]?.id ?? null);
  const [expandedObjectionId, setExpandedObjectionId] = useState<string | null>(null);

  const navigate = useCallback(
    (id: string) => {
      scrollToId(id, scrollOffsetPx);
    },
    [scrollOffsetPx],
  );

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {open ? (
        <div
          className="pointer-events-auto flex max-h-[min(72vh,560px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0a0a]/95 shadow-2xl shadow-black/60 backdrop-blur-lg"
          role="dialog"
          aria-label="Script et objections rapides"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#D4AF37]">
              <BookOpen className="h-3.5 w-3.5" />
              Accès rapide
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Fermer le panneau"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex border-b border-white/10 p-1">
            <button
              type="button"
              onClick={() => setTab("script")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                tab === "script" ? "bg-[#D4AF37]/20 text-amber-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Démo (mot à mot)
            </button>
            <button
              type="button"
              onClick={() => setTab("objections")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                tab === "objections" ? "bg-[#D4AF37]/20 text-amber-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Objections
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {tab === "script" ? (
              <ul className="space-y-2">
                {scriptBlocks.map((block) => {
                  const isOpen = expandedScriptId === block.id;
                  return (
                    <li key={block.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedScriptId(isOpen ? null : block.id);
                          navigate(block.id);
                        }}
                        className="flex w-full items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition-colors hover:border-[#D4AF37]/35 hover:bg-white/[0.07]"
                      >
                        <span className="mt-0.5 shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                          {block.phase}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-zinc-200">{block.label}</span>
                          {isOpen ? (
                            <span className="mt-1 block whitespace-pre-line text-xs leading-relaxed text-zinc-400">
                              {block.text}
                            </span>
                          ) : (
                            <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                              {block.text.split("\n")[0]}
                            </span>
                          )}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-2">
                {objections.map((o) => {
                  const isOpen = expandedObjectionId === o.id;
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedObjectionId(isOpen ? null : o.id);
                          navigate(o.id);
                        }}
                        className="flex w-full flex-col rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition-colors hover:border-[#D4AF37]/35 hover:bg-white/[0.07]"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[11px] font-black text-zinc-300">
                            {o.number}
                          </span>
                          <span className="min-w-0 flex-1 text-xs font-semibold text-zinc-200">
                            « {o.objection} »
                          </span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-zinc-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
                          )}
                        </span>
                        {isOpen ? (
                          <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                            {o.replyParagraphs.map((p, i) => (
                              <p key={i} className="text-xs leading-relaxed text-zinc-400">
                                {p}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="border-t border-white/10 px-3 py-2 text-[10px] text-zinc-600">
            Clic = défile la page + détail ici
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-3 text-sm font-bold text-amber-100 shadow-lg shadow-black/40 backdrop-blur-md hover:bg-[#D4AF37]/25"
        aria-expanded={open}
      >
        {open ? <Minimize2 className="h-4 w-4" /> : <MessageSquareQuote className="h-4 w-4" />}
        {open ? "Réduire" : "Script & objections"}
      </button>
    </div>
  );
}
