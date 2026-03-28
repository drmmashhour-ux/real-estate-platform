"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";
import {
  AnalyticsPreviewMockup,
  CrmPipelinePreviewMockup,
  DashboardPreviewMockup,
  DocumentRoomPreviewMockup,
  OfferContractPreviewMockup,
} from "@/components/marketing/ProductPreviewMockups";

const tabs = [
  { id: "dash", label: "Dashboard", content: <DashboardPreviewMockup /> },
  { id: "crm", label: "CRM pipeline", content: <CrmPipelinePreviewMockup /> },
  { id: "offer", label: "Offer & contract", content: <OfferContractPreviewMockup /> },
  { id: "docs", label: "Document room", content: <DocumentRoomPreviewMockup /> },
  { id: "analytics", label: "Analytics", content: <AnalyticsPreviewMockup /> },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ScreenshotsSection() {
  const [tab, setTab] = useState<TabId>(tabs[0].id);
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Product preview"
          title="See the workspace in action"
          subtitle="Illustrative screens with sample brokerage data — the same modules and layout ship in production."
        />
        <AnimatedReveal>
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === t.id
                    ? "bg-premium-gold text-black"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-8 min-h-[320px]">{active.content}</div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
