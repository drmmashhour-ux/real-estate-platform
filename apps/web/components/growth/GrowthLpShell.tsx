"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/tracking/events";
import { PLATFORM_NAME } from "@/lib/brand/platform";

export type GrowthLpVariant = "host" | "buy" | "rent" | "invest";

type Props = {
  variant: GrowthLpVariant;
  headline: string;
  subhead: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** When set, secondary CTA also records `broker_lead` (verified intent, not a fake conversion). */
  secondaryIntent?: "broker_lead";
  bullets: string[];
};

function GrowthLpShellTracked({
  variant,
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  secondaryIntent,
  bullets,
}: Props) {
  const searchParams = useSearchParams();
  const expId = searchParams.get("exp")?.trim().slice(0, 64) ?? "";
  const expVar = searchParams.get("var")?.trim().slice(0, 32) ?? "";

  useEffect(() => {
    const path =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "";
    trackEvent("page_view", {
      path,
      growth_lp: variant,
      funnel: "lecipm_growth_v1",
      ...(expId ? { experimentId: expId, variant: expVar || "a" } : {}),
    });
  }, [variant, expId, expVar]);

  function onPrimaryClick() {
    trackEvent("cta_click", {
      growth_lp: variant,
      cta: "primary",
      href: primaryCta.href,
      ...(expId ? { experimentId: expId, variant: expVar || "a" } : {}),
    });
  }

  function onSecondaryClick() {
    if (!secondaryCta) return;
    trackEvent("cta_click", {
      growth_lp: variant,
      cta: "secondary",
      href: secondaryCta.href,
      ...(expId ? { experimentId: expId, variant: expVar || "a" } : {}),
    });
    if (secondaryIntent === "broker_lead") {
      trackEvent("broker_lead", {
        growth_lp: variant,
        href: secondaryCta.href,
        ...(expId ? { experimentId: expId, variant: expVar || "a" } : {}),
      });
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#050505] px-4 py-16 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold/90">{PLATFORM_NAME}</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{headline}</h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">{subhead}</p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={primaryCta.href}
            onClick={onPrimaryClick}
            className="inline-flex min-w-[200px] justify-center rounded-xl bg-premium-gold px-8 py-3 text-sm font-bold text-[#0B0B0B] transition hover:brightness-110"
          >
            {primaryCta.label}
          </Link>
          {secondaryCta ? (
            <Link
              href={secondaryCta.href}
              onClick={onSecondaryClick}
              className="inline-flex min-w-[200px] justify-center rounded-xl border border-white/15 px-8 py-3 text-sm font-semibold text-white hover:border-premium-gold/40"
            >
              {secondaryCta.label}
            </Link>
          ) : null}
        </div>

        <ul className="mx-auto mt-12 max-w-xl space-y-3 text-left text-sm text-zinc-500">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-premium-gold/80" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-xs text-zinc-600">
          Secure payments where checkout applies · Verified flows where shown · Québec-focused marketplace
        </p>
      </div>
    </main>
  );
}

/** LP shell with optional `?exp=&var=` for A/B metadata on growth_events. */
export function GrowthLpShell(props: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] bg-[#050505] px-4 py-16 text-white">
          <div className="mx-auto max-w-3xl animate-pulse text-center text-zinc-600">Loading…</div>
        </main>
      }
    >
      <GrowthLpShellTracked {...props} />
    </Suspense>
  );
}
