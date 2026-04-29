/** Admin Growth Hub — serialized lead rows (API JSON) without `@prisma/client`. */

export type SerializedGrowthLead = {
  id: string;
  role: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  category: string | null;
  intent: string | null;
  source: string;
  permissionStatus: string;
  stage: string;
  assignedToUserId: string | null;
  lastContactAt: string | null;
  lastTemplateKey: string | null;
  notes: string | null;
  referralCode: string | null;
  referredByUserId: string | null;
  consentAt: string | null;
  needsFollowUp: boolean;
  followUpReason: string | null;
  archivedAt: string | null;
  listingAcquisitionLeadId: string | null;
  brokerRoute: string;
  leadUrgency: string;
  preferPlatformMortgageExpert: boolean;
  createdAt: string;
  updatedAt: string;
};
