"use client";

import { HubAiInsightWidget } from "@/components/ai/HubAiWidgets";

type ListingLite = {
  id: string;
  title: string;
  city: string;
  status: string;
  moderationStatus: string;
  docsUploaded: number;
  declarationDone: boolean;
};

export function SellerPublishReadinessAiCard({ listing }: { listing: ListingLite }) {
  const ctx = {
    listingId: listing.id,
    title: listing.title,
    city: listing.city,
    status: listing.status,
    moderationStatus: listing.moderationStatus,
    documentsUploadedCount: listing.docsUploaded,
    sellerDeclarationCompleted: listing.declarationDone,
  };

  return (
    <HubAiInsightWidget
      hub="seller"
      feature="publish_readiness"
      intent="summary"
      title="Publish readiness (AI)"
      context={ctx}
      accent="var(--color-premium-gold)"
    />
  );
}
