"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "lecipm_onboarding_v1";

type Goal = "buy" | "sell" | "rent" | "evaluate" | null;

const GOAL_ROUTES: Record<NonNullable<Goal>, string> = {
  buy: "/listings",
  sell: "/sell",
  rent: "/search/bnhub",
  evaluate: "/evaluate",
};

export function OnboardingModal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [goal, setGoal] = useState<Goal>(null);

  const sp = searchParams?.toString() ?? "";

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/embed")) return;

    const force = new URLSearchParams(sp).get("onboarding") === "1";
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (done && !force) return;
      // Let InvestmentWelcomeModal show first on homepage (investment demo flow).
      const investmentWelcomeDone = localStorage.getItem("lecipm_investment_welcome_v1");
      if ((pathname === "/" || pathname === "/analyze") && !investmentWelcomeDone && !force) return;
    } catch {
      return;
    }

    const t = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(t);
  }, [pathname, sp]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    if (new URLSearchParams(sp).get("onboarding") === "1" && pathname) {
      window.history.replaceState({}, "", pathname);
    }
    setOpen(false);
    setStep(1);
    setGoal(null);
  };

  const goToFlow = () => {
    if (!goal) return;
    const dest = GOAL_ROUTES[goal];
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    window.location.href = dest;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-premium-gold/40 bg-[#121212] p-6 shadow-2xl shadow-black/60">
        <button
          type="button"
          onClick={finish}
          className="absolute right-4 top-4 rounded-lg border border-white/15 px-2 py-1 text-xs text-[#737373] hover:border-premium-gold/50 hover:text-white"
        >
          Skip
        </button>

        {step === 1 ? (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-premium-gold">Welcome</p>
            <h2 id="onboard-title" className="mt-2 text-2xl font-bold text-white">
              Welcome to LECIPM
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">
              Buy, sell, rent short stays, or get a free property evaluation—all with Quebec-focused tools and
              licensed broker support when you want it.
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-8 w-full rounded-xl bg-premium-gold py-3 text-sm font-bold text-[#0B0B0B]"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-premium-gold">Step 2</p>
            <h2 className="mt-2 text-xl font-bold text-white">What do you want to do?</h2>
            <div className="mt-6 grid gap-2">
              {(
                [
                  ["buy", "Buy property", "Browse listings and connect with professionals"],
                  ["sell", "Sell property", "FSBO or broker — your choice"],
                  ["rent", "Rent / short stays (BNHub)", "Search, book, pay securely"],
                  ["evaluate", "Get a free evaluation", "AI estimate + optional broker follow-up"],
                ] as const
              ).map(([k, title, sub]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setGoal(k)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    goal === k
                      ? "border-premium-gold bg-premium-gold/15 text-white"
                      : "border-white/15 text-[#B3B3B3] hover:border-premium-gold/40"
                  }`}
                >
                  <span className="block font-semibold text-white">{title}</span>
                  <span className="mt-0.5 block text-xs">{sub}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!goal}
              onClick={goToFlow}
              className="mt-6 w-full rounded-xl bg-premium-gold py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-40"
            >
              Go
            </button>
            <p className="mt-4 text-center text-xs text-[#737373]">
              <Link href="/how-it-works" className="text-premium-gold hover:underline" onClick={finish}>
                Read how LECIPM works
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
