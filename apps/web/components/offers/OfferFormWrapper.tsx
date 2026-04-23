"use client";

import React, { useState } from "react";
import { OfferForm } from "./OfferForm";
import { PrivacyConsentGate } from "@/modules/privacy/components/PrivacyConsentGate";

interface OfferFormWrapperProps {
  userId: string;
  listingId: string;
  defaultOfferPriceUsd?: number | null;
  initialHasConsent: boolean;
}

export function OfferFormWrapper({
  userId,
  listingId,
  defaultOfferPriceUsd,
  initialHasConsent,
}: OfferFormWrapperProps) {
  const [hasConsent, setHasConsent] = useState(initialHasConsent);

  if (!hasConsent) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="mb-8 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-200 text-sm">
          <p className="font-bold mb-1">Mandatory Privacy Acknowledgement</p>
          <p>Under LECIPM compliance policy and Québec Law 25, you must review and accept our data handling 
             practices before starting a real estate transaction.</p>
        </div>
        <PrivacyConsentGate 
          userId={userId} 
          onSuccess={() => setHasConsent(true)} 
        />
      </div>
    );
  }

  return (
    <OfferForm 
      listingId={listingId} 
      defaultOfferPriceUsd={defaultOfferPriceUsd} 
    />
  );
}
