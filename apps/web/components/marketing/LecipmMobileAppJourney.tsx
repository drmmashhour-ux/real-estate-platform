"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";

type ScreenStep = {
  kind: "screen";
  /** Layer index 1–5 (hub-by-hub tour). */
  step: string;
  /** Hub or area this screen belongs to (matches in-app navigation). */
  hubLabel: string;
  title: string;
  subtitle: string;
  /**
   * Optional screen capture. Place files under `public/marketing/bnhub-layers/` and set e.g.
   * `"/marketing/bnhub-layers/layer-01.webp"`. Omit or leave empty for a placeholder slot.
   */
  image?: string;
  /** Short gold headline — what the user actually gets on this screen. */
  highlight: string;
  highlightSub: string;
  /**
   * When `image` is set and true: capture already includes BNHUB / LECIPM chrome — render image only.
   */
  hasInAppChrome?: boolean;
};

type GreetingStep = { kind: "greeting" };

type Layer = ScreenStep | GreetingStep;

/* Layer images: add under `apps/web/public/marketing/bnhub-layers/` then set `image` per step. */
const SCREENS: ScreenStep[] = [
  {
    kind: "screen",
    step: "1",
    hubLabel: "BNHUB · Guest home",
    title: "Header, modes & hero",
    subtitle:
      "BNHUB mark and tagline, guest links (reservation, client & host dashboards), mode chips — Stays, Trips, Travel AI — and the split hero with Where to next? Listing codes keep every stay identifiable.",
    image: "/marketing/bnhub-layers/layer-01-bnhub-hero.png",
    hasInAppChrome: true,
    highlight: "The surface guests see first",
    highlightSub: "Same gold-on-dark system as the live BNHUB guest experience.",
  },
  {
    kind: "screen",
    step: "2",
    hubLabel: "BNHUB · Wallet",
    title: "Balance, charts, and cards",
    subtitle:
      "Money in motion: total balance, investments, recent payouts, and card actions — the wallet lane hosts use next to trips and listings on one account.",
    highlight: "Trip money and payouts in one glance",
    highlightSub: "Flows, bars, and transactions you can scan between bookings — not a separate banking app.",
  },
  {
    kind: "screen",
    step: "3",
    hubLabel: "BNHUB · Map + rail",
    title: "Property on map with a listing rail",
    subtitle:
      "Map-first exploration: filters, pins, and a vertical rail of stays or homes — the same mental model as web map search, tightened for thumb reach.",
    highlight: "Tap a pin, pull up the card",
    highlightSub: "Switch context without losing the map — ideal for comparing neighborhoods.",
  },
  {
    kind: "screen",
    step: "4",
    hubLabel: "BNHUB · Stays",
    title: "Hero card for the destination",
    subtitle:
      "Full-bleed imagery and quick actions on a premium frame — how BNHUB sells a city or a listing before you open dates or message the host.",
    highlight: "Make the stay feel real immediately",
    highlightSub: "Photography-forward cards that match the luxe gold-on-dark brand.",
  },
  {
    kind: "screen",
    step: "5",
    hubLabel: "BNHUB · AI",
    title: "Concierge on top of the hub",
    subtitle:
      "Layered assistance: prompts and answers while you stay inside BNHUB — aligned with the web AI workspace, without breaking the flow of trips or listings.",
    highlight: "Ask without leaving the stack",
    highlightSub: "Context from your session — host, guest, or buyer — in one gold-on-dark surface.",
  },
];

const LAYERS: Layer[] = [...SCREENS, { kind: "greeting" as const }];

function PhoneShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[280px] sm:max-w-[300px] ${className}`}>
      <div className="rounded-[2.4rem] border-[11px] border-[#121212] bg-[#121212] p-[2px] shadow-[0_28px_64px_-14px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.22),0_0_48px_rgba(212,175,55,0.08)]">
        <div className="relative aspect-[9/19.2] overflow-hidden rounded-[2rem] bg-black ring-1 ring-white/[0.06]">
          {children}
        </div>
      </div>
    </div>
  );
}

function bnHubChromeSubtitle(hubLabel: string) {
  return hubLabel.replace(/^\s*BNHUB\s*[·.]\s*/i, "").trim();
}

function layerHasImage(layer: ScreenStep) {
  return Boolean(layer.image?.trim());
}

function LayerMainPlaceholder({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-gradient-to-b from-white/[0.04] via-transparent to-black ${compact ? "min-h-[70%] py-4" : "min-h-0 flex-1 py-8"}`}
      aria-hidden
    >
      <span
        className={`rounded-full border border-premium-gold/25 bg-premium-gold/10 px-3 py-1 font-medium text-premium-gold/90 ${compact ? "text-[8px]" : "text-[10px]"}`}
      >
        Layer artwork
      </span>
      <p
        className={`mt-2 text-center text-slate-600 ${compact ? "max-w-[7rem] text-[7px] leading-snug" : "max-w-[11rem] px-3 text-[9px] leading-relaxed"}`}
      >
        Add PNG or WebP to{" "}
        <code className="rounded bg-white/[0.06] px-1 font-mono text-[8px] text-slate-500">public/marketing/bnhub-layers/</code>
      </p>
    </div>
  );
}

function PhoneScreenChrome({
  rightLabel,
  children,
  showFooter,
}: {
  rightLabel: string;
  children: ReactNode;
  showFooter: boolean;
}) {
  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-black">
      <div className="pointer-events-none flex shrink-0 items-start justify-between gap-2 px-2.5 pt-2.5">
        <span className="rounded-full bg-premium-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black shadow-sm">
          BNHUB
        </span>
        {rightLabel ? (
          <span
            className="max-w-[58%] truncate rounded-full bg-zinc-800/95 px-2.5 py-1 text-[9px] font-semibold text-white ring-1 ring-white/10"
            title={rightLabel}
          >
            {rightLabel}
          </span>
        ) : null}
      </div>
      <div className="relative mt-1 flex min-h-0 flex-1 flex-col px-2">{children}</div>
      {showFooter ? (
        <p
          className="pointer-events-none shrink-0 pb-2 pt-1 text-center text-[9px] font-medium tracking-[0.14em] text-premium-gold/80"
          aria-hidden
        >
          {PLATFORM_NAME}
        </p>
      ) : null}
    </div>
  );
}

function PeekBehind({ layer, style }: { layer: Layer; style: React.CSSProperties }) {
  if (layer.kind === "greeting") {
    return (
      <div className="pointer-events-none absolute w-[90%]" style={style} aria-hidden>
        <PhoneShell>
          <div className="h-full min-h-full bg-gradient-to-b from-premium-gold/15 via-[#0f0f0f] to-black" />
        </PhoneShell>
      </div>
    );
  }
  const hasAsset = layerHasImage(layer);
  return (
    <div className="pointer-events-none absolute w-[90%]" style={style} aria-hidden>
      <PhoneShell>
        {hasAsset ? (
          <div className="relative h-full w-full min-h-0">
            <Image src={layer.image!} alt="" fill className="object-cover object-top" sizes="220px" />
          </div>
        ) : (
          <div className="absolute inset-0 min-h-0">
            <PhoneScreenChrome rightLabel={bnHubChromeSubtitle(layer.hubLabel)} showFooter>
              <LayerMainPlaceholder compact />
            </PhoneScreenChrome>
          </div>
        )}
      </PhoneShell>
    </div>
  );
}

function ScreenLayerView({ layer }: { layer: ScreenStep }) {
  const chromeRight = bnHubChromeSubtitle(layer.hubLabel);
  const hasAsset = layerHasImage(layer);
  const appNative = hasAsset && layer.hasInAppChrome === true;

  if (!hasAsset) {
    return (
      <PhoneShell>
        <div className="absolute inset-0 min-h-0">
          <PhoneScreenChrome rightLabel={chromeRight} showFooter>
            <LayerMainPlaceholder />
          </PhoneScreenChrome>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="relative h-full w-full min-h-0 bg-black">
        <Image
          src={layer.image!}
          alt={`BNHUB — ${layer.title} · ${PLATFORM_NAME}`}
          fill
          className={appNative ? "object-contain object-top" : "object-cover object-top"}
          sizes="300px"
          priority={layer.step === "1"}
        />
        {!appNative ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/55" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-2.5 pt-2.5">
              <span className="rounded-full bg-premium-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black shadow-sm">
                BNHUB
              </span>
              {chromeRight ? (
                <span
                  className="max-w-[58%] truncate rounded-full bg-zinc-800/95 px-2.5 py-1 text-[9px] font-semibold text-white ring-1 ring-white/10"
                  title={chromeRight}
                >
                  {chromeRight}
                </span>
              ) : null}
            </div>
            <p
              className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[9px] font-medium tracking-[0.12em] text-premium-gold/75"
              aria-hidden
            >
              {PLATFORM_NAME}
            </p>
          </>
        ) : null}
      </div>
    </PhoneShell>
  );
}

function GreetingLayerView() {
  return (
    <PhoneShell>
      <div className="flex h-full flex-col items-center justify-between bg-gradient-to-b from-[#1c1608] via-[#0a0a0a] to-black px-5 py-10 text-center">
        <div className="mt-2">
          <Image
            src="/branding/lecipm-logo-gold.png"
            width={176}
            height={56}
            className="mx-auto h-12 w-auto object-contain opacity-95"
            alt=""
          />
        </div>
        <div>
          <p className="font-serif text-2xl font-semibold text-premium-gold sm:text-3xl">Welcome to {PLATFORM_NAME}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{PLATFORM_CARREFOUR_NAME}</p>
          <p className="mt-6 text-base font-medium text-white">Thank you for touring the app.</p>
          <p className="mt-2 text-xs text-slate-500">Same account on web &amp; mobile — BNHUB guest &amp; Immobilier Hub.</p>
        </div>
        <p className="text-[11px] text-premium-gold/80">✦ {PLATFORM_NAME}</p>
      </div>
    </PhoneShell>
  );
}

/**
 * Interactive stack: tap top layer to advance 1→5 (BNHUB-focused mockups + AI), then LECIPM greeting.
 */
export function LecipmMobileAppJourney() {
  const [pointer, setPointer] = useState(0);
  const reduceMotion = useReducedMotion();
  const atEnd = pointer >= LAYERS.length - 1;

  const advance = () => {
    if (atEnd) {
      setPointer(0);
      return;
    }
    setPointer((p) => Math.min(p + 1, LAYERS.length - 1));
  };

  const current = LAYERS[pointer];
  const peek1 = pointer + 1 < LAYERS.length ? LAYERS[pointer + 1] : null;
  const peek2 = pointer + 2 < LAYERS.length ? LAYERS[pointer + 2] : null;

  const exitProps = reduceMotion
    ? { x: 0, opacity: 0 }
    : { x: 220, opacity: 0, rotate: 6, transition: { duration: 0.42, ease: [0.32, 0.72, 0, 1] as const } };

  return (
    <div>
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold/90">Interactive tour</p>
        <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">BNHUB in five layers — then LECIPM</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
          Phone frame, BNHUB + context pills, and LECIPM footer stay fixed. Drop your captures into{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-premium-gold/90">
            public/marketing/bnhub-layers/
          </code>{" "}
          and set each step&apos;s <code className="rounded bg-white/10 px-1 font-mono text-xs">image</code> in{" "}
          <code className="rounded bg-white/10 px-1 font-mono text-xs">LecipmMobileAppJourney.tsx</code>.{" "}
          <strong className="text-slate-300">Tap the phone</strong> (or Next) for 1 → 5, then the welcome card.
        </p>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Copy for current step */}
        <div className="min-w-0 flex-1 text-center lg:sticky lg:top-28 lg:max-w-sm lg:text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={pointer}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {!atEnd && current.kind === "screen" ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border border-premium-gold/40 bg-premium-gold/15 px-1 text-sm font-bold text-premium-gold tabular-nums">
                      {current.step}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {current.hubLabel}
                    </span>
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-white sm:text-xl">{current.title}</h4>
                  <p className="mt-2 text-sm text-slate-400">{current.subtitle}</p>
                  <p className="mt-5 text-base font-semibold text-premium-gold">{current.highlight}</p>
                  <p className="mt-1 text-sm text-slate-500">{current.highlightSub}</p>
                </>
              ) : (
                <>
                  <h4 className="text-lg font-semibold text-white sm:text-xl">You&apos;re at the welcome screen</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Tap the phone again to <strong className="text-slate-200">restart</strong> from layer 1.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <button
              type="button"
              onClick={advance}
              className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-premium-gold/90"
            >
              {atEnd ? "Tour again" : "Next layer"}
            </button>
            {!atEnd ? (
              <span className="text-xs text-slate-500">
                Layer {pointer + 1} / {LAYERS.length}
              </span>
            ) : null}
          </div>

          <p className="mt-8 text-xs text-slate-500">
            BNHUB guest (Expo). Long-term rent &amp; resale: Immobilier Hub on web — same account.
          </p>
        </div>

        {/* Stacked phones */}
        <div className="relative mx-auto flex min-h-[520px] w-full max-w-[320px] flex-1 items-start justify-center pt-2 sm:min-h-[560px]">
          {/* Progress line (decorative) */}
          <div
            className="pointer-events-none absolute bottom-8 left-4 right-4 h-px bg-gradient-to-r from-transparent via-premium-gold/35 to-transparent sm:left-8 sm:right-8"
            aria-hidden
          />

          {/* Back peeks — real app layers behind the front card */}
          {peek2 ? (
            <PeekBehind
              layer={peek2}
              style={{
                left: "50%",
                zIndex: 0,
                top: "2rem",
                opacity: 0.38,
                transform: "translate(-50%, 40px) scale(0.86)",
              }}
            />
          ) : null}
          {peek1 ? (
            <PeekBehind
              layer={peek1}
              style={{
                left: "50%",
                zIndex: 1,
                top: "1.25rem",
                opacity: 0.52,
                transform: "translate(-50%, 20px) scale(0.93)",
              }}
            />
          ) : null}

          <div className="relative z-10 w-full max-w-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={pointer}
                initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={exitProps}
                transition={{ duration: 0.38, ease: [0.25, 0.8, 0.25, 1] }}
              >
                <button
                  type="button"
                  onClick={advance}
                  className="group relative w-full rounded-[2.5rem] text-left outline-none ring-offset-2 ring-offset-black focus-visible:ring-2 focus-visible:ring-premium-gold/70"
                >
                  {current.kind === "screen" ? <ScreenLayerView layer={current} /> : <GreetingLayerView />}
                  <span className="pointer-events-none absolute inset-0 rounded-[2.5rem] ring-0 transition group-hover:ring-2 group-hover:ring-premium-gold/30" />
                  <span className="mt-3 block text-center text-xs font-medium text-premium-gold/90 group-hover:text-premium-gold">
                    {atEnd ? "Tap to start again" : "Tap phone for next layer →"}
                  </span>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
