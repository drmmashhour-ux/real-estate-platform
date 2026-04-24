/** CRM / broker complaint intake (API + forms) — aligns with `ComplaintCase` persistence. */

export type ComplaintIntake = {
  complaintId: string;
  submittedAt: string;

  complainantName: string;
  complainantEmail?: string;
  complainantPhone?: string;
  complainantRelation?: string;

  subject: string;
  description: string;

  relatedBrokerId?: string;
  relatedEmployeeId?: string;
  relatedListingId?: string;
  relatedDealId?: string;

  preferredResolution?: string;
  evidenceDocumentIds: string[];

  consentToBeContacted: boolean;
};
