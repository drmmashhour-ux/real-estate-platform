"use client";

import Link from "next/link";
import { Ban, CheckCircle2, Skull } from "lucide-react";
import { MistakeGuard } from "./MistakeGuard";
import { BEFORE_CALL_CHECKLIST, DEAL_KILLING_MISTAKES } from "./mistakes-data";

export function MistakesPageClient() {
  return (
    <div className="min-h-screen bg-[#050505] pb-24 text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-rose-200">
            <Skull className="h-3.5 w-3.5" />
            Deal-killing mistakes
          </div>
          <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl">
            Évite ce qui <span className="text-rose-300">tue la conversion</span>
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Checklist interne LECIPM : erreurs fréquentes sur les appels courtiers, quoi faire à la place, garde-fous live
            pendant la démo, et rapide vérif avant de composer.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/marketing/psychology"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              Psychologie courtier →
            </Link>
            <Link
              href="/marketing/objections"
              className="rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-[#D4AF37]/20"
            >
              Objections &amp; script →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:px-6">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Top mistakes</h2>
          <p className="mt-2 text-sm text-zinc-500">Ce qui fait perdre l’attention ou le oui.</p>

          <div className="mt-8 space-y-8">
            {DEAL_KILLING_MISTAKES.map((m) => (
              <article
                key={m.id}
                id={m.id}
                className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-bold text-rose-300/90">Mistake {m.number}</span>
                  <h3 className="text-lg font-bold text-white">— {m.title}</h3>
                </div>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-rose-300/80">
                      <Ban className="h-3.5 w-3.5" aria-hidden />
                      Problem
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-zinc-400">
                      {m.problems.map((p) => (
                        <li key={p}>— {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald-300/80">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      What to do instead
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {m.fixes.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-100/95"
                        >
                          <span className="text-emerald-400">✔</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Live warnings</h2>
          <p className="mt-2 text-sm text-zinc-500">Pendant la démo — timer + alertes.</p>
          <div className="mt-6">
            <MistakeGuard />
          </div>
        </section>

        <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-5 sm:p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Quick checklist</h2>
          <p className="mt-2 text-sm text-zinc-500">Before call</p>
          <ul className="mt-5 space-y-3">
            {BEFORE_CALL_CHECKLIST.map((line) => (
              <li
                key={line}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-zinc-100"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                  ✔
                </span>
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
