import Link from "next/link";
import { EmailCapture } from "@/src/modules/growth/EmailCapture";
import { PLATFORM_NAME } from "@/config/branding";

const FEATURES = [
  {
    title: "AI decision layer",
    body: "Deal scoring, risk signals, and explainable checks so you know what matters before you commit.",
    tag: "AI",
  },
  {
    title: "BNHub stays",
    body: "Short-term inventory, host tools, and booking flows wired into the same trust and ops fabric.",
    tag: "BNHub",
  },
  {
    title: "Broker CRM",
    body: "Leads, pipelines, and client context — prioritized so busy teams focus on closable conversations.",
    tag: "CRM",
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "We finally have one place for trust signals and deal notes — onboarding was painless.",
    name: "Alex M.",
    role: "Buyer · Montreal",
  },
  {
    quote: "BNHub bookings and CRM leads in one stack reduced our tool sprawl overnight.",
    name: "Samira K.",
    role: "Host & investor",
  },
  {
    quote: "The AI summaries help me brief clients in minutes instead of digging through PDFs.",
    name: "Jordan P.",
    role: "Broker",
  },
] as const;

export function GrowthFeaturesSection() {
  return (
    <section id="growth-features" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-14">
      <h2 className="text-center text-2xl font-semibold text-white sm:text-3xl">Built for real decisions</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/65">
        {PLATFORM_NAME} combines intelligence, hospitality inventory, and sales workflows — without fragmenting your data.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.tag}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-premium-gold">{f.tag}</p>
            <h3 className="mt-3 text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GrowthTestimonialsSection() {
  return (
    <section id="testimonials" className="scroll-mt-24 border-y border-white/10 bg-black/30 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-semibold text-white">What early teams say</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-xs text-white/50">Illustrative quotes for launch storytelling.</p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li
              key={t.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-[#111] p-5 text-sm text-white/85"
            >
              <p className="flex-1 leading-relaxed text-white/80">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 border-t border-white/10 pt-4">
                <p className="font-medium text-white">{t.name}</p>
                <p className="text-xs text-white/50">{t.role}</p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GrowthEmailCaptureSection() {
  return (
    <section id="waitlist" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-14">
      <div className="rounded-3xl border border-premium-gold/25 bg-gradient-to-br from-premium-gold/10 via-transparent to-transparent px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Get product updates</h2>
          <p className="mt-2 text-sm text-white/65">
            One email field — we respect your inbox. Unsubscribe anytime.
          </p>
          <div className="mt-6">
            <EmailCapture source="growth_landing" buttonLabel="Notify me" placeholder="you@company.com" />
          </div>
          <p className="mt-4 text-xs text-white/45">
            Prefer to explore first?{" "}
            <Link href="/auth/signup" className="text-premium-gold hover:underline">
              Create a free account
            </Link>{" "}
            or{" "}
            <Link href="/listings" className="text-premium-gold hover:underline">
              browse listings
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
