"use client";

import { useCallback, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import {
  Bath,
  BedDouble,
  ChevronDown,
  Coffee,
  Home,
  Shield,
  Sparkles,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";

type SectionDef = {
  id: string;
  title: string;
  /** Short line for hosts — what to fill in */
  hostHint: string;
  /** Short line for guests — what they’re seeing */
  guestHint: string;
  icon: typeof Home;
  items: { id: string; label: string }[];
};

/** Demo inventory — same structure hosts set up; guests read it as the “offer guide”. */
const OFFER_SECTIONS: SectionDef[] = [
  {
    id: "space",
    title: "Space & beds",
    hostHint: "Tell guests how the home is laid out.",
    guestHint: "See sleeping arrangements and room types.",
    icon: BedDouble,
    items: [
      { id: "entire", label: "Entire place — no shared spaces" },
      { id: "beds", label: "Bed configuration listed room-by-room" },
      { id: "sofa", label: "Sofa bed / extra sleep space" },
    ],
  },
  {
    id: "kitchen",
    title: "Kitchen & dining",
    hostHint: "Check what you provide so expectations match.",
    guestHint: "Know what you can cook and serve with.",
    icon: UtensilsCrossed,
    items: [
      { id: "full", label: "Full kitchen (stove, oven, fridge)" },
      { id: "coffee", label: "Coffee machine / kettle" },
      { id: "dish", label: "Dishwasher" },
    ],
  },
  {
    id: "comfort",
    title: "Comfort & tech",
    hostHint: "Highlight AC, workspace, and entertainment.",
    guestHint: "See climate, desk, and streaming options.",
    icon: Wifi,
    items: [
      { id: "ac", label: "Air conditioning" },
      { id: "wifi", label: "Wi‑Fi included" },
      { id: "tv", label: "Smart TV / streaming" },
      { id: "desk", label: "Dedicated workspace" },
    ],
  },
  {
    id: "bath",
    title: "Bathroom",
    hostHint: "Private vs shared, tub, essentials.",
    guestHint: "Bathroom setup and toiletries.",
    icon: Bath,
    items: [
      { id: "private", label: "Private bathroom" },
      { id: "tub", label: "Bathtub or walk-in shower" },
      { id: "extras", label: "Hair dryer & basic toiletries" },
    ],
  },
  {
    id: "policies",
    title: "Policies & house rules",
    hostHint: "Guests filter on what matters — pets, events, quiet hours.",
    guestHint: "Match your trip to the host’s rules before you book.",
    icon: Shield,
    items: [
      { id: "pets", label: "Pets allowed (with rules)" },
      { id: "events", label: "Events / parties policy" },
      { id: "smoke", label: "Smoking policy" },
      { id: "cancel", label: "Cancellation tier shown clearly" },
    ],
  },
];

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.25rem] border-[10px] border-[#121212] bg-[#121212] p-[2px] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(212,175,55,0.2)]">
        <div className="relative max-h-[min(72vh,640px)] overflow-y-auto overflow-x-hidden rounded-[1.75rem] bg-black ring-1 ring-white/[0.07]">
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionAccordion({
  sections,
  mode,
  selected,
  onToggle,
  openIds,
  toggleOpen,
  compact,
}: {
  sections: SectionDef[];
  mode: "host" | "guest";
  selected: Record<string, boolean>;
  onToggle: (sectionId: string, itemId: string) => void;
  openIds: Record<string, boolean>;
  toggleOpen: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2 p-3" : "space-y-3"}>
      {sections.map((sec) => {
        const Icon = sec.icon;
        const open = openIds[sec.id] ?? false;
        const panelId = `offer-sec-${sec.id}-${mode}`;
        return (
          <div
            key={sec.id}
            className={`rounded-xl border border-premium-gold/20 bg-[#0c0c0c] ${compact ? "p-2.5" : "p-4"}`}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggleOpen(sec.id)}
              className="flex w-full items-start justify-between gap-2 rounded-lg text-left outline-none ring-offset-black transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-premium-gold/50"
            >
              <span className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-premium-gold/30 bg-premium-gold/10">
                  <Icon className="h-4 w-4 text-premium-gold" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className={`block font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>{sec.title}</span>
                  <span className={`mt-0.5 block text-neutral-500 ${compact ? "text-[10px] leading-snug" : "text-xs"}`}>
                    {mode === "host" ? sec.hostHint : sec.guestHint}
                  </span>
                </span>
              </span>
              <ChevronDown
                className={`mt-1 h-4 w-4 shrink-0 text-premium-gold transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {open ? (
              <div id={panelId} className={`border-t border-premium-gold/10 ${compact ? "mt-2 space-y-2 pt-2" : "mt-3 space-y-2.5 pt-3"}`}>
                {sec.items.map((item) => {
                  const key = `${sec.id}:${item.id}`;
                  const checked = !!selected[key];
                  if (mode === "host") {
                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-neutral-200 hover:bg-white/[0.04] ${compact ? "text-[11px]" : "text-sm"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(sec.id, item.id)}
                          className="h-4 w-4 rounded border-neutral-600 bg-[#1a1a1a] text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        {item.label}
                      </label>
                    );
                  }
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 text-neutral-300 ${compact ? "text-[11px]" : "text-sm"}`}
                    >
                      <span className="text-premium-gold" aria-hidden>
                        {checked ? "✓" : "·"}
                      </span>
                      <span className={checked ? "text-neutral-200" : "text-neutral-500 line-through opacity-70"}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Static demo “included” flags for guest preview (avoid SSR/client random mismatch). */
const DEMO_GUEST_SELECTION: Record<string, boolean> = {
  "space:entire": true,
  "space:beds": true,
  "space:sofa": false,
  "kitchen:full": true,
  "kitchen:coffee": true,
  "kitchen:dish": true,
  "comfort:ac": true,
  "comfort:wifi": true,
  "comfort:tv": true,
  "comfort:desk": false,
  "bath:private": true,
  "bath:tub": true,
  "bath:extras": true,
  "policies:pets": false,
  "policies:events": true,
  "policies:smoke": true,
  "policies:cancel": true,
};

/**
 * Dual-purpose pattern: hosts configure offers section-by-section; guests use the same structure as a guide.
 * Marketing block + mobile mockup + AI entry points — wire to real listing editor when ready.
 * @param embedded — When true, omit outer border and horizontal padding (parent already constrains layout, e.g. host dashboard).
 */
export function BnHubOfferSectionsPlaybook({ embedded = false }: { embedded?: boolean }) {
  const baseId = useId();
  const [hostSelected, setHostSelected] = useState<Record<string, boolean>>({});
  const [openHost, setOpenHost] = useState<Record<string, boolean>>({ "space": true });
  const [openGuest, setOpenGuest] = useState<Record<string, boolean>>({ "space": true });

  const toggleHostOpen = useCallback((id: string) => {
    setOpenHost((o) => ({ ...o, [id]: !o[id] }));
  }, []);

  const toggleGuestOpen = useCallback((id: string) => {
    setOpenGuest((o) => ({ ...o, [id]: !o[id] }));
  }, []);

  const onHostToggle = useCallback((sectionId: string, itemId: string) => {
    const key = `${sectionId}:${itemId}`;
    setHostSelected((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  return (
    <section
      className={
        embedded ? "bg-transparent py-0" : "border-t border-white/10 bg-[#050505] py-14 sm:py-16"
      }
      aria-labelledby={`${baseId}-heading`}
    >
      <div className={embedded ? "w-full" : "mx-auto max-w-6xl px-4 sm:px-6"}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <BnHubLogoMark size="md" className="max-w-[min(100%,220px)] opacity-95" />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold/90">Listings</p>
          <h2 id={`${baseId}-heading`} className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Section-by-section offers — hosts set it; guests shop it
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
            Same accordion pattern on both sides: hosts tick what they provide so nothing is buried in a wall of text.
            Travellers open each header to compare what&apos;s included — like a smart guide, not a spreadsheet.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Coffee className="h-5 w-5 text-premium-gold" aria-hidden />
              <h3 className="text-lg font-semibold text-white">Host — build your offer</h3>
            </div>
            <p className="mb-6 text-sm text-slate-500">
              Open a section, check what applies. This mirrors how we&apos;ll structure the listing editor — clear, scannable,
              fewer mistakes at publish.
            </p>
            <SectionAccordion
              sections={OFFER_SECTIONS}
              mode="host"
              selected={hostSelected}
              onToggle={onHostToggle}
              openIds={openHost}
              toggleOpen={toggleHostOpen}
            />
          </div>

          <div>
            <div className="mb-4 flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-premium-gold" aria-hidden />
                <h3 className="text-lg font-semibold text-white">Guest — preview on a phone</h3>
              </div>
              <p className="max-w-md text-sm text-slate-500">
                The same sections become the stay detail sheet: expand to see amenities and rules before booking.
              </p>
            </div>
            <PhoneFrame>
              <div className="border-b border-premium-gold/15 bg-black px-3 py-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-premium-gold/80">BNHUB stay detail</p>
                <p className="text-[11px] text-neutral-500">Demo selection — your listing syncs here</p>
              </div>
              <SectionAccordion
                sections={OFFER_SECTIONS}
                mode="guest"
                selected={DEMO_GUEST_SELECTION}
                onToggle={() => {}}
                openIds={openGuest}
                toggleOpen={toggleGuestOpen}
                compact
              />
            </PhoneFrame>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-4xl rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-premium-gold/[0.08] via-[#0a0a0a] to-black p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-premium-gold/35 bg-premium-gold/15">
                <Sparkles className="h-5 w-5 text-premium-gold" aria-hidden />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">BNHUB AI (hosts &amp; guests)</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  <strong className="text-slate-300">Hosts:</strong> describe your unit in plain language — we help map it to
                  amenities and policies. <strong className="text-slate-300">Guests:</strong> ask for must-haves (quiet desk,
                  pet-friendly, parking) and narrow results faster.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/bnhub/travel/compare"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-premium-gold/90"
            >
              Travel AI
            </Link>
            <Link
              href="/bnhub/host/listings/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/45 hover:bg-white/5"
            >
              New listing
            </Link>
            <Link
              href="/dashboard/bnhub"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-premium-gold transition hover:underline"
            >
              Client dashboard →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
