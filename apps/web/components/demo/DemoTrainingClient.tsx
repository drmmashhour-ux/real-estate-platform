"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LeciSurfaceBootstrap } from "@/components/leci/LeciSurfaceBootstrap";
import { ChevronLeft, ChevronRight, GraduationCap, Sparkles } from "lucide-react";
import { DemoStepCard } from "./DemoStepCard";
import { DEMO_TALKING_POINTS, DEMO_TRAINING_STEPS } from "./demo-training-data";

export function DemoTrainingClient() {
  const [practiceMode, setPracticeMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const total = DEMO_TRAINING_STEPS.length;
  const activeStep = DEMO_TRAINING_STEPS[activeIndex];

  const scrollToStep = useCallback((index: number) => {
    const el = stepRefs.current[index];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    if (practiceMode) scrollToStep(activeIndex);
  }, [activeIndex, practiceMode, scrollToStep]);

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(total - 1, i + 1));

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <LeciSurfaceBootstrap
        userRole="visitor"
        draftSummary="Formation démo présentateur LECIPM"
        focusTopic="demo_training"
      />
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
            <GraduationCap className="h-3.5 w-3.5" />
            Demo Training · LECIPM
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl">
            Parcours démo <span className="text-[#D4AF37]">section par section</span>
          </h1>
          <p className="max-w-2xl text-zinc-400">
            Guide opérateur pour présenter la plateforme de façon identique à chaque fois : ordre des écrans, script
            français, et repères « où cliquer » en mode pratique.
          </p>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Introduction</h2>
        <p className="mt-3 text-lg text-zinc-300">
          Ce parcours suit une promesse d’achat type : propriété → Turbo → formulaire guidé → risques → IA → score →
          porte de signature → conclusion. Utilisez-le en formation, onboarding interne, ou partage d’équipe.
        </p>
      </section>

      {/* Practice toolbar */}
      <section className="sticky top-0 z-20 border-y border-white/10 bg-[#080808]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="flex cursor-pointer items-center gap-3 select-none">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={practiceMode}
              onChange={(e) => {
                setPracticeMode(e.target.checked);
                if (e.target.checked) scrollToStep(activeIndex);
              }}
            />
            <span className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-white/10 transition-colors peer-checked:bg-amber-500/40">
              <span className="ml-1 h-5 w-5 rounded-full bg-zinc-600 transition-transform peer-checked:translate-x-5 peer-checked:bg-amber-300" />
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Practice Mode
            </span>
          </label>

          {practiceMode ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-zinc-500">
                Étape {activeIndex + 1} / {total}
              </span>
              <div className="h-2 flex-1 min-w-[120px] max-w-xs overflow-hidden rounded-full bg-white/10 sm:flex-none sm:w-40">
                <div
                  className="h-full rounded-full bg-amber-500/80 transition-all duration-300"
                  style={{ width: `${((activeIndex + 1) / total) * 100}%` }}
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={activeIndex === 0}
                  className="rounded-lg border border-white/15 bg-white/5 p-2 text-zinc-300 hover:bg-white/10 disabled:opacity-30"
                  aria-label="Étape précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={activeIndex >= total - 1}
                  className="rounded-lg border border-white/15 bg-white/5 p-2 text-zinc-300 hover:bg-white/10 disabled:opacity-30"
                  aria-label="Étape suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {practiceMode && activeStep ? (
          <div className="border-t border-white/10 bg-amber-500/5 px-4 py-3 sm:px-6">
            <p className="mx-auto max-w-4xl text-sm font-medium leading-relaxed text-amber-100/95">
              <span className="text-amber-400/90">Script live · </span>
              {activeStep.script}
            </p>
          </div>
        ) : null}
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Déroulé pas à pas</h2>
        {DEMO_TRAINING_STEPS.map((step, index) => (
          <div
            key={step.id}
            ref={(el) => {
              stepRefs.current[index] = el;
            }}
          >
            <DemoStepCard step={step} isActive={practiceMode && index === activeIndex} practiceMode={practiceMode} />
          </div>
        ))}
      </section>

      {/* Talking points */}
      <section className="border-t border-white/10 bg-white/[0.02] py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Talking points</h2>
          <p className="mt-2 text-sm text-zinc-500">Conseils présentateur — formation & partage équipe.</p>
          <ul className="mt-6 space-y-3">
            {DEMO_TALKING_POINTS.map((line, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Practice mode recap + footer */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Mode pratique</h2>
        <p className="mt-3 text-zinc-400">
          Activez <strong className="text-zinc-200">Practice Mode</strong> pour : surligner l’étape en cours, afficher le
          script en bandeau fixe, la barre de progression, et les zones « où cliquer » renforcées sur la carte active.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/drafts/turbo"
            className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2.5 text-sm font-semibold text-amber-100 hover:bg-[#D4AF37]/20"
          >
            Ouvrir Turbo (brouillons)
          </Link>
          <Link
            href="/trust"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/10"
          >
            Page confiance (support pitch)
          </Link>
        </div>
      </section>
    </div>
  );
}
