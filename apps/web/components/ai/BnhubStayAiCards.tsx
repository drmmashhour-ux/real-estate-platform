"use client";

import { HubAiInsightWidget } from "@/components/ai/HubAiWidgets";

export type BnhubAiListingContext = {
  listingId: string;
  title: string;
  city: string;
  country: string;
  nightPriceCents: number;
  cleaningFeeCents: number;
  maxGuests: number;
  beds: number;
  baths: number;
  petsAllowed: boolean;
  partyAllowed: boolean;
  smokingAllowed: boolean;
  kidsAllowed: boolean;
  familyFriendly: boolean;
  noiseLevel: string | null;
  cancellationPolicy: string | null;
  houseRulesExcerpt: string;
  amenitiesSample: string[];
};

export function BnhubStayAiCards({ listing }: { listing: BnhubAiListingContext }) {
  const ctx = { ...listing };

  return (
    <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">BNHUB AI</p>
      <HubAiInsightWidget
        hub="bnhub"
        feature="guest_match"
        intent="analyze"
        title="Fit for your trip"
        context={ctx}
        accent="#34d399"
      />
      <HubAiInsightWidget
        hub="bnhub"
        feature="guest_trip"
        intent="summary"
        title="Fees & rules summary"
        context={ctx}
        accent="#34d399"
      />
    </div>
  );
}
