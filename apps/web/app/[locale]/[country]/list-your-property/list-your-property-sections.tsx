import Link from "next/link";
import type { ReactNode } from "react";

const STEP_ACCENTS = [
  "border-l-4 border-premium-gold/55 bg-premium-gold/[0.04]",
  "border-l-4 border-amber-400/45 bg-amber-500/[0.04]",
  "border-l-4 border-cyan-400/35 bg-cyan-500/[0.03]",
  "border-l-4 border-emerald-500/40 bg-emerald-500/[0.03]",
];

type JourneyStep = {
  title: string;
  body: string;
  videoTitle: string;
  videoHint: string;
  aiRoles: string[];
  tools: string[];
};

const JOURNEY_STEPS: JourneyStep[] = [
  {
    title: "Prepare your file — ID, photos, documents",
    body:
      "Upload proof of identity, marketing photos, and supporting exhibits. The platform AI classifies each file, runs readiness checks, and issues your F-reference when you complete intake — no listing desk, no copying from other portals.",
    videoTitle: "How we check your package",
    videoHint: "Automated structure, media hygiene, and permission attestation before anything goes live.",
    aiRoles: ["Document AI", "Photo readiness", "Compliance scan"],
    tools: ["Free AI intake", "F-reference code", "Seller Hub draft"],
  },
  {
    title: "Set price & positioning",
    body:
      "Enter your ask with AI-assisted benchmarks and narrative prompts (depth scales with your plan). Higher tiers unlock sharper comparables-style signals and performance analytics — still under your control, not a substitute for an appraisal or legal advice.",
    videoTitle: "Price with context",
    videoHint: "Signals, not promises — you decide the number on the listing.",
    aiRoles: ["Valuation signals", "Price narrative", "Risk flags"],
    tools: ["Standard visibility rules", "Pro analytics", "Premium placement"],
  },
  {
    title: "Attract buyers & manage interest",
    body:
      "Your listing earns visibility according to plan tier. AI helps tighten copy, rank media, and route serious inquiries so you spend time on real conversations — not spam.",
    videoTitle: "Visibility that scales with your plan",
    videoHint: "Upgrade when you want more reach, not to unlock basic honesty.",
    aiRoles: ["Listing AI", "Visibility scoring", "Inquiry routing"],
    tools: ["Search placement", "Featured slots (Premium)", "Trust & verification rails"],
  },
  {
    title: "Offers, paperwork, close",
    body:
      "Track offers and next steps in-platform. Formal instruments and broker-grade drafting books remain in the administrator toolkit; consumer-facing flows stay guided and automated. Consult your notary or counsel for binding legal work.",
    videoTitle: "A calmer path to signature",
    videoHint: "Checklists and summaries — not a law firm in a box.",
    aiRoles: ["Offer summary AI", "Task checklist", "Closing prep prompts"],
    tools: ["Deal workspace", "Premium broker collaboration", "Document slots in Hub"],
  },
];

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/12 bg-black/40 px-3 py-1 text-xs font-medium text-slate-200">
      {children}
    </span>
  );
}

export function ListYourPropertySellerJourney() {
  return (
    <section className="mt-16 scroll-mt-24" aria-labelledby="journey-heading">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold/85">Your journey</p>
        <h2 id="journey-heading" className="mt-3 font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Sell by yourself — with an AI desk behind you
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
          Every stage is automated: classification, checks, scoring, and routing. Upgrade when you want more reach and
          deeper intelligence — not to unlock basic honesty.
        </p>
      </div>

      <div className="relative mx-auto mt-12 max-w-5xl">
        <div
          className="pointer-events-none absolute left-[15px] top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-premium-gold/50 via-white/15 to-emerald-500/30 md:block"
          aria-hidden
        />
        <ol className="space-y-12 md:space-y-14">
          {JOURNEY_STEPS.map((step, i) => (
            <li key={step.title} className="relative md:pl-12">
              <div className="absolute left-0 top-0 hidden h-9 w-9 items-center justify-center rounded-full border-2 border-premium-gold/70 bg-black text-sm font-bold text-premium-gold shadow-[0_0_20px_rgba(212,175,55,0.25)] md:flex">
                {i + 1}
              </div>
              <div className="mb-2 flex items-center gap-2 md:hidden">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-premium-gold/60 bg-black text-xs font-bold text-premium-gold">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-premium-gold/80">Step {i + 1}</span>
              </div>

              <div
                className={`grid gap-6 rounded-2xl border border-white/10 p-5 sm:p-6 md:grid-cols-[1fr_260px] md:gap-8 lg:grid-cols-[1fr_280px] ${STEP_ACCENTS[i] ?? ""}`}
              >
                <div>
                  <h3 className="font-serif text-lg font-semibold text-white sm:text-xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.body}</p>
                  <div className="mt-5 rounded-xl border border-white/10 bg-black/35 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold/75">{step.videoTitle}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{step.videoHint}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-5 border-t border-white/10 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">AI capabilities</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {step.aiRoles.map((r) => (
                        <Pill key={r}>{r}</Pill>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Tools & plan unlocks
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {step.tools.map((t) => (
                        <Pill key={t}>{t}</Pill>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] leading-snug text-slate-600">
                    Not legal, tax, or appraisal advice. Where required, engage licensed professionals.
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm text-slate-400">
        <span className="text-slate-300">Ready to choose visibility?</span>{" "}
        <Link href="#plans" className="font-semibold text-premium-gold hover:underline">
          Compare plans
        </Link>{" "}
        or{" "}
        <Link href="#start-intake" className="font-semibold text-premium-gold hover:underline">
          start free intake
        </Link>
        .
      </div>
    </section>
  );
}

const VALUE_CARDS = [
  {
    title: "End-to-end AI intake",
    body: "Uploads are scanned, tagged, and checked before publication — fewer surprises, faster time-to-ready.",
    icon: "◆",
  },
  {
    title: "Direct inquiries, not noise",
    body: "Routing and trust signals steer serious buyers toward your listing; you stay in control of conversations.",
    icon: "◇",
  },
  {
    title: "Revenue you control",
    body: "Start free. Upgrade for placement, analytics, and collaboration — we earn when you choose to scale, not from hidden desk fees.",
    icon: "◈",
  },
];

export function ListYourPropertyValueStrip() {
  return (
    <section className="mt-20 scroll-mt-24" aria-labelledby="value-heading">
      <h2 id="value-heading" className="text-center font-serif text-xl font-semibold text-white sm:text-2xl">
        Built for independent sellers — and a sustainable platform
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-400">
        Three reasons sellers stay, and why paid plans exist: reach, intelligence, and optional human-broker collaboration
        at the top tier.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {VALUE_CARDS.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/40 p-6 shadow-[0_20px_60px_rgb(0_0_0/0.35)]"
          >
            <p className="text-lg text-premium-gold/90" aria-hidden>
              {c.icon}
            </p>
            <h3 className="mt-3 font-semibold text-white">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
