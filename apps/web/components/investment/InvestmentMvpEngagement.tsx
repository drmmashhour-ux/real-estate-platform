"use client";

import { usePathname } from "next/navigation";
import { AnalyzeLinkButton } from "@/components/marketing/AnalyzeLinkButton";
import { useCallback, useEffect, useState } from "react";
import {
  dismissMvpFeedbackPrompt,
  dismissMvpRetentionBanner,
  getMvpEngagementActionCount,
  isMvpFeedbackPromptDismissed,
  isMvpRetentionBannerDismissed,
  MVP_LAST_SESSION_OPEN_TS_KEY,
  shouldShowContinueInvestmentHint,
} from "@/lib/investment/activation-storage";

const SESSION_BOOT = "lecipm_mvp_session_return_check_v1";
const RETURN_GAP_MS = 30 * 60 * 1000;

function investmentMvpPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/analyze")) return true;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/compare")) return true;
  if (pathname === "/" || pathname === "") return true;
  return false;
}

function hiddenChrome(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/embed")) return true;
  return false;
}

/**
 * Retention + feedback prompts for first real users (localStorage + session timing).
 */
export function InvestmentMvpEngagement() {
  const pathname = usePathname();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [retentionOpen, setRetentionOpen] = useState(false);

  const refreshFeedback = useCallback(() => {
    const dismissed = isMvpFeedbackPromptDismissed();
    const n = getMvpEngagementActionCount();
    setFeedbackOpen(!dismissed && n >= 2);
  }, []);

  useEffect(() => {
    refreshFeedback();
    const onActions = () => refreshFeedback();
    const onDismiss = () => setFeedbackOpen(false);
    window.addEventListener("lecipm-mvp-actions-updated", onActions);
    window.addEventListener("lecipm-mvp-feedback-dismissed", onDismiss);
    return () => {
      window.removeEventListener("lecipm-mvp-actions-updated", onActions);
      window.removeEventListener("lecipm-mvp-feedback-dismissed", onDismiss);
    };
  }, [refreshFeedback]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_BOOT)) return;
    sessionStorage.setItem(SESSION_BOOT, "1");

    try {
      const prevRaw = localStorage.getItem(MVP_LAST_SESSION_OPEN_TS_KEY);
      const prev = prevRaw ? Number.parseInt(prevRaw, 10) : 0;
      const now = Date.now();
      const isReturnSession =
        Number.isFinite(prev) &&
        prev > 0 &&
        now - prev > RETURN_GAP_MS &&
        shouldShowContinueInvestmentHint() &&
        !isMvpRetentionBannerDismissed();

      if (isReturnSession) {
        setRetentionOpen(true);
      }
      localStorage.setItem(MVP_LAST_SESSION_OPEN_TS_KEY, String(now));
    } catch {
      /* ignore private mode */
    }
  }, []);

  if (hiddenChrome(pathname) || !investmentMvpPath(pathname)) return null;

  return (
    <>
      {feedbackOpen ? (
        <div
          className="fixed bottom-20 left-1/2 z-[90] w-[min(100%,32rem)] -translate-x-1/2 px-4 sm:bottom-24"
          role="status"
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-emerald-500/35 bg-[#0f1412]/95 px-4 py-3 text-center shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-sm font-medium text-white">What do you think so far?</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                onClick={() => {
                  window.dispatchEvent(new Event("lecipm-open-feedback"));
                  dismissMvpFeedbackPrompt();
                  setFeedbackOpen(false);
                }}
              >
                Share feedback
              </button>
              <button
                type="button"
                className="text-xs text-slate-400 underline hover:text-white"
                onClick={() => {
                  dismissMvpFeedbackPrompt();
                  setFeedbackOpen(false);
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {retentionOpen ? (
        <div
          className="fixed top-16 left-1/2 z-[85] w-[min(100%,36rem)] -translate-x-1/2 px-4"
          role="status"
        >
          <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-950/80 px-4 py-2.5 text-sm text-amber-50 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">Continue your investment analysis</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <AnalyzeLinkButton
                href="/analyze"
                className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100 ring-1 ring-amber-400/40 hover:bg-amber-500/30"
              >
                Open analyzer
              </AnalyzeLinkButton>
              <button
                type="button"
                className="text-xs text-amber-200/70 underline hover:text-white"
                onClick={() => {
                  dismissMvpRetentionBanner();
                  setRetentionOpen(false);
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
