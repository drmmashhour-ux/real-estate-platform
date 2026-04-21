"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { MockBadge, MockButton, MockCard } from "@/components/lecipm-dashboard-mock/mock-ui";

const TABS = ["Content", "Compliance", "Pricing", "SEO", "Export"] as const;

export function ListingAssistantPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Content");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Listing Assistant</h1>
          <p className="mt-1 text-sm text-ds-text-secondary">AI drafts · compliance checks · Centris-ready export</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MockBadge tone="gold">AI Optimized</MockBadge>
          <MockBadge>Insured Broker</MockBadge>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-ds-border pb-px">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              tab === t ? "text-ds-gold" : "text-ds-text-secondary hover:text-white"
            }`}
          >
            {tab === t ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ds-gold shadow-[0_0_16px_rgba(212,175,55,0.45)]" />
            ) : null}
            {t}
          </button>
        ))}
      </div>

      <div className="transition-opacity duration-200">
        {tab === "Content" ? <TabContent /> : null}
        {tab === "Compliance" ? <TabCompliance /> : null}
        {tab === "Pricing" ? <TabPricing /> : null}
        {tab === "SEO" ? <TabSeo /> : null}
        {tab === "Export" ? <TabExport /> : null}
      </div>
    </div>
  );
}

function TabContent() {
  return (
    <MockCard className="space-y-6">
      <Field label="Title generator">
        <input
          readOnly
          className="w-full rounded-lg border border-ds-border bg-black/50 px-3 py-2.5 text-sm text-white outline-none ring-ds-gold/30 placeholder:text-ds-text-secondary focus:ring-2"
          placeholder="Suggested title appears here…"
          defaultValue="Bright 3-bed corner unit · rooftop terrace · Parc Lafontaine"
        />
        <MockButton className="mt-2">Regenerate title</MockButton>
      </Field>
      <Field label="Description">
        <textarea
          readOnly
          rows={5}
          className="w-full resize-y rounded-lg border border-ds-border bg-black/50 px-3 py-2.5 text-sm leading-relaxed text-ds-text-secondary outline-none focus:ring-2 focus:ring-ds-gold/30"
          defaultValue="Spacious corner layout with triple exposure. Recently updated kitchen, walk-in pantry, and private roof rights. Steps from transit and Parc Lafontaine…"
        />
      </Field>
      <Field label="Highlights">
        <ul className="space-y-2 text-sm text-ds-text-secondary">
          {["Triple exposure · corner unit", "Private roof terrace access", "Walking distance to métro"].map((x) => (
            <li key={x} className="flex gap-2">
              <span className="text-ds-gold">✦</span>
              {x}
            </li>
          ))}
        </ul>
      </Field>
    </MockCard>
  );
}

function TabCompliance() {
  return (
    <MockCard className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Risk level</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300/90">Low–medium</p>
        </div>
        <MockBadge tone="gold">Review suggested</MockBadge>
      </div>
      <div>
        <p className="text-sm font-medium text-white">Warnings</p>
        <ul className="mt-3 space-y-2">
          {[
            "Verify roof rights wording against municipal bylaws.",
            "Parking stall number missing from disclosure — add before publish.",
          ].map((w) => (
            <li
              key={w}
              className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm text-amber-100/90"
            >
              {w}
            </li>
          ))}
        </ul>
      </div>
    </MockCard>
  );
}

function TabPricing() {
  return (
    <MockCard className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">Suggested price</p>
        <p className="mt-2 text-3xl font-bold text-ds-gold">$629,000</p>
        <p className="mt-1 text-xs text-ds-text-secondary">Based on 12 comparable sales · 30d window</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">Competitiveness score</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ds-border">
          <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-ds-gold/80 to-ds-gold shadow-[0_0_20px_rgba(212,175,55,0.35)] transition-all duration-500" />
        </div>
        <p className="mt-2 text-sm font-semibold text-white">78 / 100</p>
        <p className="text-xs text-ds-text-secondary">Strong vs. median ask in micro-market</p>
      </div>
    </MockCard>
  );
}

function TabSeo() {
  return (
    <MockCard className="space-y-5">
      <Field label="Keywords">
        <div className="flex flex-wrap gap-2">
          {["Plateau", "condo", "terrace", "Parc Lafontaine", "3 bedroom"].map((k) => (
            <span key={k} className="rounded-full border border-ds-gold/30 bg-ds-gold/10 px-3 py-1 text-xs font-medium text-ds-gold">
              {k}
            </span>
          ))}
        </div>
      </Field>
      <Field label="Meta description">
        <textarea
          readOnly
          rows={3}
          className="w-full rounded-lg border border-ds-border bg-black/50 px-3 py-2.5 text-sm text-ds-text-secondary"
          defaultValue="Corner 3-bed with private roof terrace near Parc Lafontaine. Updated kitchen, triple exposure, steps from métro. Book a showing on LECIPM."
        />
      </Field>
    </MockCard>
  );
}

function TabExport() {
  return (
    <MockCard className="space-y-5">
      <p className="text-sm text-ds-text-secondary">Push structured listing data to tools and syndication partners.</p>
      <div className="flex flex-wrap gap-3">
        <MockButton>Download JSON</MockButton>
        <MockButton variant="ghost">Copy text</MockButton>
        <MockButton>Export for Centris</MockButton>
      </div>
      <p className="text-xs text-ds-text-secondary">
        Export respects broker approval workflows · syndication rules apply per board agreement.
      </p>
    </MockCard>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ds-text-secondary">{label}</p>
      {children}
    </div>
  );
}
