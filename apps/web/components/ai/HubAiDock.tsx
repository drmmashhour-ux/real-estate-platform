"use client";

import { useMemo, useState } from "react";
import type { AiHub, AiIntent } from "@/modules/ai/core/types";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { AISuggestionCard } from "./AISuggestionCard";
import { AIAuditNotice } from "./AIAuditNotice";

type Preset = { label: string; feature: string; intent: AiIntent; title: string };

const PRESETS: Record<AiHub, Preset[]> = {
  buyer: [
    { label: "Help me choose filters", feature: "search_assist", intent: "suggestion", title: "Search assistance" },
    { label: "Explain this property", feature: "listing_insight", intent: "analyze", title: "Listing insight" },
    { label: "Compare listings", feature: "compare_listings", intent: "analyze", title: "Compare listings" },
    { label: "Filter help", feature: "filter_help", intent: "suggestion", title: "Filter help" },
    { label: "Affordability", feature: "affordability", intent: "explain", title: "Affordability" },
    { label: "Costs & warnings", feature: "costs_warnings", intent: "summary", title: "Costs & warnings" },
    { label: "Before I contact someone", feature: "contact_paths", intent: "explain", title: "Contact paths" },
    { label: "Offer readiness", feature: "offer_readiness", intent: "explain", title: "Offer readiness" },
  ],
  seller: [
    { label: "Improve my listing", feature: "listing_description", intent: "draft", title: "Listing description" },
    { label: "Pricing estimate", feature: "pricing_guidance", intent: "analyze", title: "Pricing guidance" },
    { label: "Explain declaration", feature: "declaration_help", intent: "explain", title: "Declaration help" },
    { label: "Publish readiness", feature: "publish_readiness", intent: "summary", title: "Publish readiness" },
  ],
  bnhub: [
    { label: "Write my stay description", feature: "host_description", intent: "draft", title: "Stay description" },
    { label: "Nightly price idea", feature: "host_pricing", intent: "suggestion", title: "Pricing suggestion" },
    { label: "Summarize this booking", feature: "booking_summary", intent: "summary", title: "Booking summary" },
    { label: "Guest trip summary", feature: "guest_trip", intent: "summary", title: "Trip summary" },
  ],
  rent: [
    { label: "Rental description", feature: "landlord_description", intent: "draft", title: "Rental description" },
    { label: "Landlord checklist", feature: "landlord_checklist", intent: "summary", title: "Checklist" },
    { label: "Compare options", feature: "tenant_compare", intent: "analyze", title: "Compare rentals" },
  ],
  broker: [
    { label: "Summarize this lead", feature: "lead_summary", intent: "summary", title: "Lead summary" },
    { label: "Draft follow-up", feature: "follow_up_draft", intent: "draft", title: "Follow-up draft" },
    { label: "Deal summary", feature: "deal_summary", intent: "summary", title: "Deal summary" },
    { label: "Pipeline summary", feature: "pipeline_summary", intent: "summary", title: "Pipeline" },
    { label: "Next best action", feature: "next_best_action", intent: "suggestion", title: "Next action" },
    { label: "Commission context", feature: "commission_context", intent: "explain", title: "Commission context" },
  ],
  mortgage: [
    { label: "Summarize request", feature: "request_summary", intent: "summary", title: "Mortgage request" },
    { label: "Explain affordability", feature: "affordability_explain", intent: "explain", title: "Affordability" },
    { label: "Draft reply", feature: "broker_reply_draft", intent: "draft", title: "Reply draft" },
    { label: "Missing info", feature: "risk_missing", intent: "risk", title: "Risk / missing info" },
  ],
  investor: [
    { label: "Summarize this week", feature: "platform_summary", intent: "summary", title: "Activity summary" },
    { label: "Explain charts", feature: "chart_explain", intent: "explain", title: "Charts in plain English" },
    { label: "Explain this trend", feature: "trend_explain", intent: "explain", title: "Trends" },
    { label: "Market news", feature: "market_news", intent: "summary", title: "News summary" },
    { label: "Strategy Q&A", feature: "strategy_qa", intent: "explain", title: "Strategy" },
  ],
  admin: [
    { label: "Daily operations", feature: "daily_report", intent: "summary", title: "Daily report" },
    { label: "Period report", feature: "period_report", intent: "summary", title: "Weekly / monthly" },
    { label: "Dispute digest", feature: "dispute_digest", intent: "summary", title: "Disputes" },
    { label: "Analyze risk", feature: "risk_scan", intent: "risk", title: "Risk scan" },
    { label: "Moderation summary", feature: "moderation_summary", intent: "summary", title: "Moderation" },
    { label: "Finance snapshot", feature: "finance_summary", intent: "summary", title: "Finance" },
  ],
};

type Props = {
  hub: AiHub;
  /** Merged into every AI request (listing id, titles, etc.) */
  context?: Record<string, unknown>;
  accent?: string;
  legalFinancialSurface?: boolean;
};

function panelContextFromHub(
  hub: AiHub,
  ctx: Record<string, unknown>
): { listingId?: string; bookingId?: string; role?: string; surface?: string } {
  const listingId = typeof ctx.listingId === "string" ? ctx.listingId : undefined;
  const bookingId = typeof ctx.bookingId === "string" ? ctx.bookingId : undefined;
  return {
    listingId,
    bookingId,
    role: typeof ctx.role === "string" ? ctx.role : hub,
    surface: typeof ctx.surface === "string" ? ctx.surface : hub,
  };
}

export function HubAiDock({ hub, context = {}, accent = "var(--color-premium-gold)", legalFinancialSurface }: Props) {
  const [preset, setPreset] = useState<Preset | null>(null);

  const presets = useMemo(() => PRESETS[hub] ?? [], [hub]);

  const mergedContext = useMemo(() => ({ hub, ...context }), [hub, context]);

  return (
    <>
      <AISuggestionCard title="AI assistant" accent={accent} footer={<AIAuditNotice variant="compact" />}>
        <p className="text-xs text-slate-500">
          Short, contextual help for this hub. Nothing is auto-approved — you stay in control.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <li key={p.feature + p.label}>
              <button
                type="button"
                onClick={() => {
                  setPreset(p);
                }}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10"
                style={{ borderColor: `${accent}44` }}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      </AISuggestionCard>

      {preset ? (
        <div className="mt-4 space-y-2">
          <button
            type="button"
            className="text-xs text-slate-400 underline hover:text-slate-200"
            onClick={() => setPreset(null)}
          >
            Close assistant
          </button>
          <AIAssistantPanel
            key={`${preset.feature}-${preset.intent}`}
            title={preset.title}
            subtitle={
              legalFinancialSurface
                ? "Legal or financial topics need human review — AI output is guidance only."
                : undefined
            }
            context={panelContextFromHub(hub, mergedContext)}
            agentKey={preset.feature}
          />
        </div>
      ) : null}
    </>
  );
}
