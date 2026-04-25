"use client";

import Link from "next/link";
import { Brain, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { PsychologyTips } from "./PsychologyTips";
import {
  BROKERS_CARE_ABOUT,
  BROKERS_FEAR,
  GREEN_FLAGS,
  MAKES_THEM_SAY_YES,
  POSITIONING_PAIRS,
  RED_FLAGS,
} from "./psychology-data";

function BulletList({ items, icon: Icon, tone }: { items: string[]; icon: typeof CheckCircle2; tone: "gold" | "rose" | "emerald" }) {
  const ring =
    tone === "gold"
      ? "border-[#D4AF37]/25 bg-[#D4AF37]/5"
      : tone === "rose"
        ? "border-rose-500/25 bg-rose-500/5"
        : "border-emerald-500/25 bg-emerald-500/5";
  const iconClass =
    tone === "gold" ? "text-[#D4AF37]" : tone === "rose" ? "text-rose-300" : "text-emerald-300";

  return (
    <ul className="space-y-3">
      {items.map((line) => (
        <li
          key={line}
          className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed text-zinc-200 ${ring}`}
        >
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden />
          {line}
        </li>
      ))}
    </ul>
  );
}

export function PsychologyPageClient() {
  return (
    <div className="min-h-screen bg-[#050505] pb-24 text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
            <Brain className="h-3.5 w-3.5" />
            Psychologie · Courtiers Québec
          </div>
          <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl">
            Comment ils pensent, <span className="text-[#D4AF37]">ce qui les fait dire oui</span>
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Cadre interne pour l’opérateur : priorités, peurs, déclencheurs d’adhésion, formulation sûre au Québec — et
            repères live pendant la démo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/marketing/objections"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              Objections &amp; script →
            </Link>
            <Link
              href="/marketing/demo-training"
              className="rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-[#D4AF37]/20"
              >
              Parcours démo →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 lg:grid-cols-[1fr_320px] lg:gap-12 lg:px-6">
        <div className="order-2 space-y-14 lg:order-1">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Ce qui compte pour eux</h2>
            <p className="mt-2 text-sm text-zinc-500">What brokers care about</p>
            <div className="mt-6">
              <BulletList items={BROKERS_CARE_ABOUT} icon={CheckCircle2} tone="gold" />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Ce qu’ils redoutent</h2>
            <p className="mt-2 text-sm text-zinc-500">What they fear</p>
            <div className="mt-6">
              <BulletList items={BROKERS_FEAR} icon={XCircle} tone="rose" />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Ce qui fait dire oui</h2>
            <p className="mt-2 text-sm text-zinc-500">What makes them say yes</p>
            <div className="mt-6">
              <BulletList items={MAKES_THEM_SAY_YES} icon={Sparkles} tone="emerald" />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Comment positionner LECIPM</h2>
            <p className="mt-2 text-sm text-zinc-500">Positioning engine — parle comme un courtier, pas comme une pitch deck</p>
            <div className="mt-6 space-y-4">
              {POSITIONING_PAIRS.map((pair) => (
                <div
                  key={pair.insteadOf}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-rose-300/90">Éviter</p>
                  <p className="mt-1 text-zinc-500 line-through decoration-rose-500/50">❌ « {pair.insteadOf} »</p>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-emerald-300/90">Dire plutôt</p>
                  <p className="mt-1 text-lg font-semibold leading-snug text-zinc-100">✔ « {pair.say} »</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/90">Green flags</h2>
              <p className="mt-1 text-[11px] text-zinc-500">Intéressé</p>
              <ul className="mt-4 space-y-2">
                {GREEN_FLAGS.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-100/90"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400/90">Red flags</h2>
              <p className="mt-1 text-[11px] text-zinc-500">Tu perds la salle</p>
              <ul className="mt-4 space-y-2">
                {RED_FLAGS.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-100/90"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="order-1 lg:order-2 lg:pt-0">
          <PsychologyTips sticky />
        </div>
      </div>
    </div>
  );
}
