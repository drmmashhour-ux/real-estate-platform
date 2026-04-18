import type { AcquisitionChannel } from "@/lib/attribution/signup-attribution";

export type UserCategory = "bnhub_host" | "guest" | "broker" | "buyer" | "seller" | "other";

export type ActivationKey =
  | "host_first_listing_published"
  | "guest_first_booking"
  | "broker_first_deal"
  | "buyer_first_inquiry"
  | "none";

export type FirstUserRow = {
  userId: string;
  /** Last 4 chars of email only — privacy-preserving for founder review. */
  emailSuffix: string;
  role: string;
  category: UserCategory;
  createdAt: string;
  acquisitionChannel: AcquisitionChannel | "unknown";
  activation: {
    key: ActivationKey;
    achieved: boolean;
    detail?: string;
  };
  retention: {
    /** Weak proxy: account touched after signup window, or repeat booking signal. */
    likelyReturned: boolean;
    notes: string;
  };
};

export type EarlyTractionSnapshot = {
  generatedAt: string;
  totalUsers: number;
  milestones: {
    hundred: { target: number; progressCount: number; complete: boolean };
    thousand: { target: number; progressCount: number; complete: boolean };
  };
  activatedCounts: {
    hostListingPublished: number;
    guestBooking: number;
    brokerDeal: number;
    buyerInquiry: number;
  };
  firstUsersSample: FirstUserRow[];
  disclaimers: string[];
};
