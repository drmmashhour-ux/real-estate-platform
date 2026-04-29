"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { gtagReportEvent } from "@/modules/analytics/services/gtag";
import { pushRetargetingPayload } from "@/lib/retargeting/data-layer";
import { track } from "@/lib/tracking";
import { INVESTMENT_HUB_FOCUS, isInvestmentShellPath } from "@/lib/product-focus";
import { suppressGlobalMarketingOverlays } from "@/lib/ui/dev-overlays";
import { appPathnameFromUrl } from "@/i18n/pathname";

function hiddenPath(pathname: string | null): boolean {
  if (!pathname) return true;
  if (appPathnameFromUrl(pathname) === "/") return true;
  if (INVESTMENT_HUB_FOCUS && isInvestmentShellPath(pathname)) return true;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/embed")) return true;
  return false;
}

export function GrowthConversionLayer() {
  const pathname = usePathname();
  const [popupOpen, setPopupOpen] = useState(false);

  /** No timed fullscreen popup — it blocked the entire viewport (z-50) and broke page interaction. */

  const fireCta = useCallback(
    (label: string, href: string) => {
      track("growth_cta", { meta: { label, href } });
      gtagReportEvent("growth_cta", { label, href });
      pushRetargetingPayload("growth_cta", { label, href });
    },
    []
  );

  if (suppressGlobalMarketingOverlays()) return null;
  if (hiddenPath(pathname)) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-premium-gold/30 bg-[#0B0B0B]/95 px-3 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-4 lg:bottom-0 max-lg:bottom-[calc(4.15rem+env(safe-area-inset-bottom))] max-lg:z-[68]"
        role="region"
        aria-label="Quick actions"
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 sm:justify-between">
          <p className="hidden text-xs text-white/60 sm:block">Get started in one tap</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/mortgage"
              onClick={() => fireCta("sticky_preapproved", "/mortgage")}
              className="rounded-lg bg-premium-gold px-4 py-2 text-xs font-bold text-black sm:text-sm"
            >
              Get pre-approved
            </Link>
            <Link
              href="/experts"
              onClick={() => fireCta("sticky_expert", "/experts")}
              className="rounded-lg border border-premium-gold/50 px-4 py-2 text-xs font-semibold text-premium-gold sm:text-sm"
            >
              Talk to expert
            </Link>
            <button
              type="button"
              onClick={() => {
                setPopupOpen(true);
                fireCta("sticky_estimate_open", "/evaluate");
              }}
              className="rounded-lg border border-premium-gold/50 bg-premium-gold/5 px-4 py-2 text-xs font-semibold text-premium-gold transition hover:border-premium-gold/75 hover:bg-premium-gold/12 sm:text-sm"
            >
              Free estimate
            </button>
          </div>
        </div>
      </div>

      {popupOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/70"
            aria-label="Close"
            onClick={() => setPopupOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-premium-gold/35 bg-[#111] p-6 text-white shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-premium-gold">Free mortgage estimate</p>
            <h2 className="mt-2 text-xl font-bold">See what you could afford</h2>
            <p className="mt-2 text-sm text-white/75">
              Use our guided tool or speak with a mortgage expert — no obligation.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/evaluate"
                className="rounded-xl bg-premium-gold py-3 text-center text-sm font-bold text-black"
                onClick={() => {
                  fireCta("popup_evaluate", "/evaluate");
                  setPopupOpen(false);
                }}
              >
                Start free estimate
              </Link>
              <Link
                href="/mortgage"
                className="rounded-xl border border-white/20 py-3 text-center text-sm font-medium text-white"
                onClick={() => {
                  fireCta("popup_mortgage", "/mortgage");
                  setPopupOpen(false);
                }}
              >
                Go to mortgage hub
              </Link>
              <button type="button" className="py-2 text-xs text-white/50" onClick={() => setPopupOpen(false)}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
