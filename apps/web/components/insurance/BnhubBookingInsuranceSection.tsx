"use client";

import { InsuranceLeadForm } from "@/components/InsuranceLeadForm";

type Props = {
  bookingId: string;
  listingId: string;
  isGuest: boolean;
};

/**
 * High-intent moment: only after booking is paid/confirmed (not during checkout).
 */
export function BnhubBookingInsuranceSection({ bookingId, listingId, isGuest }: Props) {
  if (!isGuest) return null;

  return (
    <InsuranceLeadForm
      variant="A"
      leadType="travel"
      source="bnbhub"
      listingId={listingId}
      bookingId={bookingId}
      headline="Protect your trip"
      subheadline="Booked and confirmed — optional travel coverage. Licensed partner follow-up only with your consent."
    />
  );
}
