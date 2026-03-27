import Link from "next/link";
import { PLATFORM_NAME, platformBrandGoldTextClass } from "@/lib/brand/platform";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What does this platform do?",
    a: "It helps you analyze and track real estate investments using data-driven insights.",
  },
  {
    q: "Do I need experience in real estate?",
    a: "No. The platform simplifies complex calculations so anyone can understand deals.",
  },
  {
    q: "Is this real data?",
    a: "The platform uses calculated insights and market-based logic. Future versions will include live data.",
  },
  {
    q: "Can I save and compare deals?",
    a: "Yes. You can save deals, track them in your dashboard, and compare multiple investments.",
  },
  {
    q: "Is the platform free?",
    a: "Basic features are free. Advanced tools will be available in future premium plans.",
  },
];

function IconSpark() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function IconSteps() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
}

function IconFaq() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export type LecipmPlatformExplainAccent = "gold" | "slate";

type Props = {
  accent?: LecipmPlatformExplainAccent;
  /** Show link to full /about-platform at bottom */
  showAboutLink?: boolean;
};

/**
 * “What is LECIPM?”, “How it works”, and FAQ — used on the homepage and /about-platform.
 */
export function LecipmPlatformExplainSections({ accent = "gold", showAboutLink = false }: Props) {
  const isGold = accent === "gold";
  const eyebrow = isGold ? "text-[#C9A646]" : "text-emerald-400";
  const border = isGold ? "border-white/10" : "border-slate-800";
  const cardBg = isGold ? "bg-[#121212]" : "bg-slate-900/60";
  const muted = isGold ? "text-[#9CA3AF]" : "text-slate-400";
  const body = isGold ? "text-[#B3B3B3]" : "text-slate-300";
  const iconWrap = isGold ? "bg-[#C9A646]/12 text-[#C9A646]" : "bg-emerald-500/15 text-emerald-300";
  const divider = isGold ? "border-[#C9A646]/20" : "border-slate-800";

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* What is LECIPM */}
      <section id="what-is-lecipm" className="scroll-mt-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}>
            <IconSpark />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${eyebrow}`}>Platform</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              What is <span className={platformBrandGoldTextClass}>{PLATFORM_NAME}</span>?
            </h2>
            <div className={`mt-6 space-y-4 rounded-2xl border ${border} ${cardBg} p-6 sm:p-8`}>
              <p className={`text-base leading-relaxed sm:text-lg ${body}`}>
                <span className={platformBrandGoldTextClass}>{PLATFORM_NAME}</span> is an AI-powered real estate
                investment platform that helps users analyze deals, compare opportunities, and track their portfolio in
                one place.
              </p>
              <div className={`border-t ${divider}`} aria-hidden />
              <p className={`text-sm leading-relaxed sm:text-base ${muted}`}>
                Instead of relying on spreadsheets or guesswork, users can instantly evaluate ROI, cash flow, risk, and
                market performance to make smarter investment decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}>
            <IconSteps />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${eyebrow}`}>Process</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">How It Works</h2>
            <ol className="mt-8 grid gap-4 sm:gap-6">
              {[
                {
                  n: "1",
                  title: "Enter property details",
                  sub: "(price, rent, expenses)",
                  desc: "Add the basics once — the model uses them to estimate returns and risk.",
                },
                {
                  n: "2",
                  title: "Get instant analysis",
                  sub: "(ROI, cash flow, risk score)",
                  desc: "See results immediately so you can compare scenarios without rebuilding spreadsheets.",
                },
                {
                  n: "3",
                  title: "Compare deals and track your portfolio",
                  sub: "",
                  desc: "Save what you like, compare multiple investments, and follow performance from your dashboard.",
                },
              ].map((step) => (
                <li
                  key={step.n}
                  className={`flex gap-4 rounded-2xl border ${border} ${cardBg} p-5 sm:p-6`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isGold ? "bg-[#C9A646]/15 text-[#C9A646]" : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {step.title}
                      {step.sub ? (
                        <span className={`mt-1 block text-sm font-normal ${muted}`}>{step.sub}</span>
                      ) : null}
                    </h3>
                    <p className={`mt-2 text-sm leading-relaxed sm:text-base ${muted}`}>{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq-lecipm" className="scroll-mt-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}>
            <IconFaq />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${eyebrow}`}>Help</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.q}
                  className={`group rounded-2xl border ${border} ${cardBg} transition hover:border-white/15`}
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-white sm:text-base [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1 leading-snug">{item.q}</span>
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg font-light leading-none transition-transform duration-200 group-open:rotate-45 ${
                        isGold ? "text-[#C9A646]" : "text-emerald-400"
                      }`}
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <div className={`border-t ${border} px-5 pb-5`}>
                    <p className={`pt-4 text-sm leading-relaxed sm:text-base ${muted}`}>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
            {showAboutLink ? (
              <p className={`mt-8 text-sm ${muted}`}>
                More about the full platform:{" "}
                <Link href="/about-platform" className={`font-medium underline ${isGold ? "text-[#C9A646]" : "text-emerald-400"}`}>
                  About the platform
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
