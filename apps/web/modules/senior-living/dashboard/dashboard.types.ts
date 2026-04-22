/** Payload shapes for Senior Living Hub role dashboards (operations-focused). */

export type SeniorDashboardRoleKind = "RESIDENCE_OPERATOR" | "RESIDENCE_MANAGER" | "PLATFORM_ADMIN";

export type ResidenceKpis = {
  newLeadsWeek: number;
  highPriorityLeads: number;
  visitsBookedWeek: number;
  availableUnits: number;
  totalUnits: number;
};

export type ResidenceLeadQueueItem = {
  id: string;
  requesterName: string;
  status: string;
  band: string | null;
  score: number | null;
  createdAt: string;
  needsFollowUp: boolean;
};

export type ResidenceVisitItem = {
  id: string;
  createdAt: string;
  label: string;
};

export type ResidenceAvailability = {
  availableUnits: number;
  occupiedUnits: number;
  totalUnits: number;
};

export type ResidencePerformance = {
  responseTimeHours: number | null;
  conversionRate: number | null;
  operatorScore: number | null;
  trustScore: number | null;
  profileCompleteness: number | null;
  rankHint: string | null;
};

export type ResidenceDashboardPayload = {
  role: "RESIDENCE_OPERATOR";
  residence: { id: string; name: string; city: string; verified: boolean };
  kpis: ResidenceKpis;
  leadQueue: ResidenceLeadQueueItem[];
  visits: { upcoming: ResidenceVisitItem[]; recent: ResidenceVisitItem[] };
  availability: ResidenceAvailability;
  performance: ResidencePerformance;
  aiSuggestions: string[];
  alerts: Array<{ id: string; severity: "info" | "warn"; message: string }>;
  generatedAt: string;
};

export type ManagementKpis = {
  totalResidences: number;
  leadsWeek: number;
  visitsBookedWeek: number;
  moveInsOrConversionsWeek: number;
  avgResponseTimeHours: number | null;
  avgOccupancyPct: number | null;
};

export type ManagementResidenceRow = {
  residenceId: string;
  name: string;
  city: string;
  leadsWeek: number;
  visitsWeek: number;
  conversionRate: number | null;
  occupancyPct: number | null;
  rankingScore: number | null;
  alert: string | null;
};

export type ManagementTeamRow = {
  label: string;
  value: string;
  status: "ok" | "watch" | "risk";
};

export type ManagementDashboardPayload = {
  role: "RESIDENCE_MANAGER";
  groupLabel: string;
  kpis: ManagementKpis;
  residences: ManagementResidenceRow[];
  teamPerformance: ManagementTeamRow[];
  occupancy: { totalAvailable: number; totalUnits: number; byResidence: Array<{ name: string; pct: number }> };
  demand: Array<{ residenceName: string; newLeadsWeek: number }>;
  aiInsights: string[];
  alerts: Array<{ id: string; severity: "info" | "warn"; message: string }>;
  generatedAt: string;
};

export type AdminKpis = {
  leadsToday: number;
  highQualityLeadRatio: number | null;
  activeOperators: number;
  responseSlaOk: boolean;
  revenueTodayCad: number | null;
  revenueMonthCad: number | null;
  activeCities: number;
};

export type AdminMarketplaceHealth = {
  supplyDemandIndex: number | null;
  leadQualityBuckets: Array<{ label: string; count: number }>;
  avgResponseHours: number | null;
  conversionFunnel: { new: number; contacted: number; closed: number };
};

export type AdminCityRow = {
  city: string;
  leads: number;
  signal: "strong" | "ok" | "weak";
  note: string;
};

export type AdminOperatorRow = {
  operatorId: string;
  name: string;
  residences: number;
  score: number | null;
  status: "top" | "ok" | "watch";
};

export type AdminApprovalItem = {
  id: string;
  kind: string;
  title: string;
  status: string;
};

export type AdminActivityItem = { at: string; label: string };

export type AdminDashboardPayload = {
  role: "PLATFORM_ADMIN";
  kpis: AdminKpis;
  marketplaceHealth: AdminMarketplaceHealth;
  hotLeads: Array<{
    id: string;
    requesterName: string;
    residenceName: string;
    city: string;
    band: string | null;
  }>;
  stuckCases: Array<{ leadId: string; residenceName: string; city: string; issue: string }>;
  cities: AdminCityRow[];
  operators: AdminOperatorRow[];
  approvals: AdminApprovalItem[];
  activityFeed: AdminActivityItem[];
  alerts: Array<{ id: string; severity: "info" | "warn" | "urgent"; message: string }>;
  aiActions: string[];
  generatedAt: string;
};
