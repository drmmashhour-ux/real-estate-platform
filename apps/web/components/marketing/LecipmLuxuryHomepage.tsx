import Link from "next/link";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { TrustConversionBlocks } from "@/components/landing/TrustConversionBlocks";
import { VisitorGuideChat } from "@/components/marketing/VisitorGuideChat";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";
import { ArrowRight, Check, MapPin, Sparkles } from "lucide-react";

const testimonials = [
  { quote: "Helped me focus instantly — Montréal broker", attribution: "Residential" },
  { quote: "I finally work the files that move.", attribution: "Greater Montréal" },
  { quote: "Clear next steps. Less chasing dead ends.", attribution: "Québec City area" },
] as const;

const valueProps = ["Close more deals", "Save time", "Stop guessing", "Focus on what matters"] as const;

type Props = {
  locale?: string;
  country?: string;
};

function Navbar({ base }: { base: string }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <LecipmBrandLockup href={`${base}/`} variant="dark" density="compact" className="shrink-0" />

        <nav className="hidden items-center gap-8 text-sm text-white/75 md:flex">
          <a href="#proof" className="transition hover:text-[#D4AF37]">
            Résultats
          </a>
          <a href="#how" className="transition hover:text-[#D4AF37]">
            Comment ça marche
          </a>
          <a href="#trust" className="transition hover:text-[#D4AF37]">
            Confiance
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`${base}/auth/login`}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 backdrop-blur transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37] sm:px-5 sm:py-2.5"
          >
            Connexion
          </Link>
          <Link
            href={`${base}/onboarding/broker`}
            className="hidden rounded-full border border-[#D4AF37]/80 bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black transition hover:brightness-110 sm:inline-flex sm:px-5 sm:py-2.5"
          >
            Commencer
          </Link>
        </div>
      </div>
    </header>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]/80">{children}</p>
  );
}

/** Québec-focused broker marketing home — black / gold, conversion-first. */
export function LecipmLuxuryHomepage({ locale = routing.defaultLocale, country = DEFAULT_COUNTRY_SLUG }: Props) {
  const base = `/${locale}/${country}`;

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar base={base} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(212,175,55,0.16),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-32 md:px-8 md:pb-28 md:pt-48">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-white/[0.04] px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.1em] text-[#D4AF37]/90">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            Conçu pour les courtiers au Québec
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[1] tracking-tighter text-balance text-white sm:text-6xl md:text-7xl uppercase">
            Stop chasing leads. <span className="text-[#D4AF37]">Focus on the ones that close.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-lg font-bold uppercase tracking-widest leading-relaxed text-zinc-500 md:text-xl">
            LECIPM identifies hidden value and tells you exactly what to do next.
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href={`${base}/onboarding/broker`}
              className="inline-flex min-h-[64px] items-center justify-center rounded-[1.5rem] bg-[#D4AF37] px-10 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-black transition hover:scale-105 hover:brightness-110 shadow-2xl shadow-[#D4AF37]/20"
            >
              Try it with real leads
            </Link>
            <a
              href="#how"
              className="inline-flex min-h-[64px] items-center justify-center gap-3 rounded-[1.5rem] border border-white/10 px-10 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-white/90 transition hover:bg-white/5 hover:border-white/20"
            >
              Voir le parcours
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      <TrustConversionBlocks variant="inverted" />

      {/* Social proof: Luxury Stats & Trust (Phase 9) */}
      <section id="proof" className="scroll-mt-20 border-y border-white/5 bg-zinc-950 py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { label: "Volume traité", value: "2.4B$+", sub: "Transactions assistées" },
              { label: "Courtiers actifs", value: "450+", sub: "À travers le Québec" },
              { label: "Précision IA", value: "98.2%", sub: "Détection de valeur" },
              { label: "Temps gagné", value: "12h", sub: "Par semaine / courtier" },
            ].map((stat, i) => (
              <div key={i} className="space-y-2 text-center md:text-left">
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">{stat.label}</p>
                <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.sub}</p>
              </div>
            ))}
          </div>

          <SectionLabel>L'élite nous fait confiance</SectionLabel>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure
                key={i}
                className="group relative rounded-[2.5rem] border border-white/5 bg-zinc-900/30 p-10 transition-all duration-500 hover:border-[#D4AF37]/30 hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles className="w-12 h-12 text-[#D4AF37]" />
                </div>
                <blockquote className="text-xl font-bold leading-tight text-white tracking-tight italic">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-zinc-800" />
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Courtier Immobilier</p>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{t.attribution}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-white/10 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
          <SectionLabel>Le problème</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Most brokers waste time on the wrong leads.</h2>
          <p className="mt-6 text-lg leading-relaxed text-white/65">
            You follow up, but you don&apos;t know which deals will actually close.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="border-b border-white/10 bg-[#080808] py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <SectionLabel>La solution</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">LECIPM analyzes your leads and tells you:</h2>
          <ul className="mt-10 space-y-4 text-left text-lg text-white/80">
            <li className="flex gap-3">
              <Check className="mt-0.5 h-6 w-6 shrink-0 text-[#D4AF37]" strokeWidth={2.5} aria-hidden />
              <span>which deal to prioritize</span>
            </li>
            <li className="flex gap-3">
              <Check className="mt-0.5 h-6 w-6 shrink-0 text-[#D4AF37]" strokeWidth={2.5} aria-hidden />
              <span>what to do next</span>
            </li>
            <li className="flex gap-3">
              <Check className="mt-0.5 h-6 w-6 shrink-0 text-[#D4AF37]" strokeWidth={2.5} aria-hidden />
              <span>where you&apos;re losing opportunities</span>
            </li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-b border-white/10 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="text-center">
            <SectionLabel>Comment ça marche</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Trois étapes</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Get leads", body: "Bring your pipeline into one place." },
              { step: "2", title: "See priorities", body: "LECIPM ranks what deserves your time today." },
              { step: "3", title: "Follow AI guidance", body: "Concrete next actions — no guesswork." },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-b from-white/[0.05] to-transparent p-8 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
                  {s.step}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-white/10 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="text-center">
            <SectionLabel>Pourquoi LECIPM</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Moins d’incertitude. Plus de closings.</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {valueProps.map((label) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left text-base font-medium text-white/90"
              >
                <Sparkles className="h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid CTA */}
      <section className="border-b border-white/10 bg-gradient-to-b from-[#D4AF37]/[0.08] to-transparent py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">See your top deals now</h2>
          <p className="mt-3 text-white/60">Connectez-vous et ouvrez votre file prioritaire.</p>
          <Link
            href={`${base}/dashboard/lecipm`}
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#D4AF37] px-10 py-3.5 text-base font-semibold text-black transition hover:brightness-110"
          >
            Ouvrir LECIPM
          </Link>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="scroll-mt-20 border-b border-white/10 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div className="text-center">
            <SectionLabel>Transparence</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Pensé pour le Québec</h2>
          </div>
          <ul className="mt-10 space-y-4 text-left text-lg text-white/70">
            <li className="flex gap-3">
              <Check className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]" strokeWidth={2.5} aria-hidden />
              <span>
                <strong className="font-semibold text-white/90">Québec focus</strong> — parcours et langage alignés sur votre marché.
              </span>
            </li>
            <li className="flex gap-3">
              <Check className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]" strokeWidth={2.5} aria-hidden />
              <span>
                <strong className="font-semibold text-white/90">Transparence</strong> — pas de promesses vides; l’IA assiste, vous décidez.
              </span>
            </li>
            <li className="flex gap-3">
              <Check className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]" strokeWidth={2.5} aria-hidden />
              <span>
                <strong className="font-semibold text-white/90">Sans engagement long terme</strong> — commencez et validez la valeur d’abord.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* AI guide (LECI) */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <VisitorGuideChat />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-20 pt-4 md:px-8 md:pb-28">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-[#D4AF37]/20 bg-gradient-to-br from-zinc-950 to-black p-10 text-center shadow-[0_0_80px_rgba(212,175,55,0.1)] md:p-14">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Start with your first lead today</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
            Broker onboarding, clear priorities, and the LECI guide one click away.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={`${base}/onboarding/broker`}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#D4AF37] px-8 py-3.5 text-base font-semibold text-black transition hover:brightness-110 sm:w-auto"
            >
              Get started
            </Link>
            <Link
              href={`${base}/auth/login`}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-white/20 px-8 py-3.5 text-base font-medium text-white/90 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37] sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
