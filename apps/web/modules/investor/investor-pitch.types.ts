/** LECIPM investor pitch dashboard + export payload types */

export type HubRevenueKey = "BNHub" | "Broker" | "Listings" | "Residence" | "Investor" | "Other";

export type NarrativeBlockKey =
  | "problem"
  | "solution"
  | "product"
  | "traction"
  | "businessModel"
  | "vision";

export type NarrativeBlockVm = {
  key: NarrativeBlockKey;
  title: string;
  paragraphs: string[];
};

export type PitchSlideVm = {
  index: number;
  id: string;
  title: string;
  bullets: string[];
};

export type GrowthPointVm = {
  date: string;
  totalUsers: number;
  totalListings: number;
  bookings: number;
  revenue: number;
};

export type InvestorPitchDashboardVm = {
  generatedAt: string;
  sampleMode: boolean;
  overview: {
    multiHub: string[];
    aiLayer: string[];
    growthEngine: string[];
  };
  marketPosition: string[];
  liveMetrics: {
    totalUsers: number;
    totalListings: number;
    bookings30d: number;
    leads30dApprox: number;
    revenue30dApprox: number;
  };
  revenueByHub: Record<HubRevenueKey, number>;
  revenueByHubDisclaimer: string;
  growthDaily: GrowthPointVm[];
  growthWeekly: GrowthPointVm[];
  aiHighlights: string[];
  growthActions: string[];
  narrativeBlocks: NarrativeBlockVm[];
  acquisitionSnapshot?: {
    totalContacts: number;
    conversionRateByType: Record<string, number>;
  };
  slides: PitchSlideVm[];
};
