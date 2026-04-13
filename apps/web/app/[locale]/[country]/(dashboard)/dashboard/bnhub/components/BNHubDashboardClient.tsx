"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AiActionCenter } from "@/components/ai/AiActionCenter";
import { HubAiDock } from "@/components/ai/HubAiDock";
import { PremiumSectionCard } from "@/components/hub/PremiumSectionCard";
import type { HubTheme } from "@/lib/hub/themes";

type AiData = {
  pricingSuggestion: string;
  recommendedCents: number;
  minCents: number;
  maxCents: number;
  demandLevel: string;
  factors: string[];
  occupancyRate: number;
  occupancyInsight: string;
  revenueTips: string[];
  listingId: string | null;
};

export function BNHubDashboardClient({ theme }: { theme: HubTheme }) {
  const [ai, setAi] = useState<AiData | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetch("/api/bnhub/ai")
      .then((r) => r.json())
      .then((d) => setAi(d))
      .catch(() => setAi(null));
  }, []);

  async function handleApplyToListing() {
    if (!ai?.listingId || ai.recommendedCents == null) return;
    setApplying(true);
    setApplied(false);
    try {
      const res = await fetch(`/api/bnhub/listings/${ai.listingId}/apply-price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendedCents: ai.recommendedCents }),
      });
      if (res.ok) setApplied(true);
    } finally {
      setApplying(false);
    }
  }

  const recommendations = [
    {
      id: "1",
      title: "Suggested price",
      description: ai?.pricingSuggestion ?? "Loading AI pricing…",
      urgency: "high" as const,
      actionLabel: "Apply to listing",
      actionHref: "#",
    },
    {
      id: "2",
      title: "Occupancy insight",
      description: ai?.occupancyInsight ?? "Loading occupancy…",
      urgency: "medium" as const,
      actionLabel: "Host dashboard",
      actionHref: "/bnhub/host/dashboard",
    },
    {
      id: "3",
      title: "Revenue tips",
      description: ai?.revenueTips?.length ? ai.revenueTips[0] : "Professional photos and instant-book can increase conversion.",
      urgency: "low" as const,
      actionLabel: "View tips",
      actionHref: "/bnhub/host/dashboard",
    },
  ];

  return (
    <>
      <div className="mb-6">
        <HubAiDock hub="bnhub" />
      </div>
      <AiActionCenter
        hubType="bnhub"
        recommendations={recommendations}
        theme={theme}
        performanceSummary="AI pricing, occupancy optimization, and revenue tips for your listings."
      />
      <PremiumSectionCard title="AI Booking Summary" theme={theme} accent={theme.accent}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            {ai ? (
              <>
                <p className="text-sm opacity-80">
                  Recommended nightly: <strong>${(ai.recommendedCents / 100).toFixed(2)}</strong>
                  {" "}({ai.minCents / 100}–{ai.maxCents / 100})
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {ai.occupancyInsight}
                </p>
              </>
            ) : (
              <p className="text-sm opacity-80">Loading…</p>
            )}
          </div>
          {ai?.listingId ? (
            <button
              type="button"
              onClick={handleApplyToListing}
              disabled={applying}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: theme.accent }}
            >
              {applying ? "Applying…" : applied ? "Applied ✓" : "Apply to listing"}
            </button>
          ) : (
            <Link
              href="/bnhub/host/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: theme.accent }}
            >
              Add a listing first
            </Link>
          )}
        </div>
      </PremiumSectionCard>
    </>
  );
}
