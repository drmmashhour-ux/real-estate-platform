/** First 100 Users — internal acquisition CRM (controlled early-stage). */

export type AcquisitionContactType = "BROKER" | "HOST" | "RESIDENCE" | "USER";

export type AcquisitionSource = "manual" | "referral" | "event";

/** Part 1 — relationship tracking */
export type AcquisitionRelationshipStatus = "CONTACTED" | "INTERESTED" | "ONBOARDED" | "LOST";

/** Part 2 — outreach pipeline / kanban */
export type AcquisitionPipelineStage =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "DEMO_SCHEDULED"
  | "CONVERTED"
  | "LOST";

export type AcquisitionNoteVm = {
  id: string;
  at: string;
  body: string;
  adminUserId?: string | null;
};

export type AcquisitionContactVm = {
  id: string;
  type: AcquisitionContactType;
  name: string;
  email: string | null;
  phone: string | null;
  source: AcquisitionSource;
  relationshipStatus: AcquisitionRelationshipStatus;
  pipelineStage: AcquisitionPipelineStage;
  notes: AcquisitionNoteVm[];
  assignedAdminId: string | null;
  linkedUserId: string | null;
  leadsGenerated: number;
  revenueCents: number;
  firstContactedAt: string | null;
  convertedAt: string | null;
  timeToOnboardMs: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AcquisitionDashboardVm = {
  pipeline: Record<AcquisitionPipelineStage, AcquisitionContactVm[]>;
  contacts: AcquisitionContactVm[];
  metrics: AcquisitionMetricsVm;
  onboardingSamples: OnboardingProgressVm[];
  unreadNotifications: number;
};

export type AcquisitionMetricsVm = {
  totalContacts: number;
  byType: Record<string, number>;
  conversionRateByType: Record<string, number>;
  avgTimeToOnboardMsByType: Record<string, number | null>;
  avgLeadsPerContact: number;
  avgRevenuePerConvertedCents: number;
};

export type OnboardingProgressVm = {
  userId: string;
  completionPercent: number;
  milestones: {
    accountCreatedAt: string | null;
    firstListingAt: string | null;
    firstBookingOrLeadAt: string | null;
    subscriptionActivatedAt: string | null;
  };
};

export type AcquisitionSummaryMobileVm = {
  metrics: AcquisitionMetricsVm;
  pipelineCounts: Record<AcquisitionPipelineStage, number>;
  recentContacts: Array<
    Pick<AcquisitionContactVm, "id" | "name" | "type" | "pipelineStage" | "createdAt">
  >;
};
