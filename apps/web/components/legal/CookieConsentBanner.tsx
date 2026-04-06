"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { suppressGlobalMarketingOverlays } from "@/lib/ui/dev-overlays";

const STORAGE_KEY = "legal_cookie_consent";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const devSuppress = suppressGlobalMarketingOverlays();

  useEffect(() => {
    if (devSuppress) return;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      setAccepted(raw === "true");
    } catch {
      setAccepted(false);
    }
    setMounted(true);
  }, [devSuppress]);

  useEffect(() => {
    if (!devSuppress || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  }, [devSuppress]);

  function handleAccept() {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      setAccepted(true);
    } catch {
      setAccepted(true);
    }
  }

  if (devSuppress) return null;
  if (!mounted || accepted) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900/95 px-4 py-3 shadow-lg backdrop-blur sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-300">
          We use cookies to improve your experience and for essential operation of the platform.{" "}
          <Link href="/legal/cookies" className="font-medium text-emerald-400 hover:text-emerald-300 underline">
            Cookie Policy
          </Link>
        </p>
        <button
          type="button"
          data-testid="accept-cookies"
          onClick={handleAccept}
          className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
