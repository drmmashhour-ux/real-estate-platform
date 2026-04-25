"use client";

import { MessageCircle } from "lucide-react";

const OPEN_EVENT = "lecipm-visitor-guide-open";

/**
 * In-page guide block — opens the global LECI assistant (`LeciWidget`, bottom-right on all pages).
 */
export function VisitorGuideChat() {
  function openGuide() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(OPEN_EVENT));
  }

  return (
    <section
      id="visitor-guide"
      aria-labelledby="visitor-guide-title"
      className="scroll-mt-24 rounded-[3rem] border border-[#D4AF37]/20 bg-zinc-900/50 p-10 md:p-14 relative overflow-hidden shadow-2xl shadow-[#D4AF37]/5"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
      <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Neural Intelligence</p>
          <h2 id="visitor-guide-title" className="text-3xl font-black tracking-tighter uppercase text-white md:text-4xl leading-none">
            Meet LECI: Your <span className="text-[#D4AF37]">Growth Partner.</span>
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 leading-relaxed">
            Priorities, Québec market context, and strategy. Always one click away in the bottom-right.
          </p>
        </div>
        <button
          type="button"
          onClick={openGuide}
          className="inline-flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-[#D4AF37] px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition hover:scale-105 hover:brightness-110 shadow-xl shadow-[#D4AF37]/20 focus:outline-none"
        >
          <MessageCircle className="h-5 w-5 fill-current" aria-hidden />
          Open Intelligence
        </button>
      </div>
    </section>
  );
}
