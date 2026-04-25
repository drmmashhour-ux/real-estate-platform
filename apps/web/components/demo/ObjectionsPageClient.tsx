"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { QuickScriptPanel } from "./QuickScriptPanel";
import { BROKER_OBJECTIONS, DEMO_SCRIPT_BLOCKS } from "./objections-data";

export function ObjectionsPageClient() {
  return (
    <div className="min-h-screen bg-[#050505] pb-32 text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
            <Shield className="h-3.5 w-3.5" />
            Québec · Courtiers
          </div>
          <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl">
            Objections <span className="text-[#D4AF37]">+ script démo</span>
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Réponses mot à mot et déroulé de démo pour présenter sans improviser. Utilisez le panneau flottant pour sauter
            à une section pendant l’appel.
          </p>
          <Link
            href="/marketing/demo-training"
            className="mt-6 inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
          >
            Parcours démo section par section →
          </Link>
        </div>
      </header>

      {/* Common objections */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Objections fréquentes</h2>
        <p className="mt-2 text-sm text-zinc-500">Réponses exactes — à dire tel quel ou presque.</p>

        <div className="mt-8 space-y-8">
          {BROKER_OBJECTIONS.map((o) => (
            <article
              key={o.id}
              id={o.id}
              className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-bold text-[#D4AF37]">Objection {o.number}</span>
                <span className="text-lg font-bold text-white">« {o.objection} »</span>
              </div>
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-300/90">Réponse</h3>
                {o.replyParagraphs.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-zinc-200">
                    {p}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Demo script */}
      <section className="border-t border-white/10 bg-white/[0.02] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Script démo (mot à mot)</h2>
          <p className="mt-2 text-sm text-zinc-500">Enchaînez dans cet ordre pendant la démo écran partagé.</p>

          <div className="mt-8 space-y-6">
            {DEMO_SCRIPT_BLOCKS.map((block) => (
              <article
                key={block.id}
                id={block.id}
                className="scroll-mt-28 rounded-2xl border border-white/10 bg-[#080808] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#D4AF37]/20 px-2 py-1 text-[10px] font-black text-amber-200">
                    {block.phase}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-400">{block.label}</h3>
                </div>
                <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-zinc-100">{block.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <QuickScriptPanel scriptBlocks={DEMO_SCRIPT_BLOCKS} objections={BROKER_OBJECTIONS} />
    </div>
  );
}
