"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyzeLinkButton } from "@/components/marketing/AnalyzeLinkButton";
import { suppressGlobalMarketingOverlays } from "@/lib/ui/dev-overlays";

const STORAGE_KEY = "lecipm_investment_welcome_v1";

/**
 * First-visit welcome for the investment demo flow (Wix → analyze → save → dashboard).
 * Shown once per browser; generic OnboardingModal defers until this is dismissed on `/`.
 */
export function InvestmentWelcomeModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (suppressGlobalMarketingOverlays()) return;
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/embed") || pathname.startsWith("/auth")) {
      return;
    }
    if (pathname !== "/") return;

    let cancelled = false;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    const t = window.setTimeout(() => {
      if (!cancelled) setOpen(true);
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [pathname]);

  useEffect(() => {
    if (!pathname) return;
    if (pathname !== "/") {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setOpen(false);
    }
  }, [pathname]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invest-welcome-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/35 bg-[#0f1412] p-6 shadow-2xl shadow-emerald-900/30">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-400 hover:border-emerald-500/40 hover:text-white"
        >
          Skip
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">Welcome</p>
        <h2 id="invest-welcome-title" className="mt-2 text-2xl font-bold text-white">
          Try the investment tools
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Welcome! Try analyzing a property to see how the platform works.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <AnalyzeLinkButton
            href="/analyze"
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
          >
            Start demo
          </AnalyzeLinkButton>
          <AnalyzeLinkButton
            href="/analyze"
            className="flex w-full items-center justify-center rounded-xl border border-white/20 py-3 text-sm font-medium text-white hover:bg-white/5"
          >
            Open analyzer
          </AnalyzeLinkButton>
        </div>
      </div>
    </div>
  );
}
