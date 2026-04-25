export type FieldLeadStatus =
  | "to_visit"
  | "scheduled"
  | "demo_done"
  | "interested"
  | "not_interested"
  | "follow_up";

export type FieldLead = {
  id: string;
  brokerName: string;
  phone: string;
  location: string;
  status: FieldLeadStatus;
  updatedAt: string;
};

export type VisitOutcome = "demo_done" | "interested" | "not_interested" | "follow_up";

export type VisitLog = {
  id: string;
  leadId: string;
  brokerNameSnapshot: string;
  at: string;
  outcome: VisitOutcome;
  note?: string;
};

export type FieldStore = {
  leads: FieldLead[];
  logs: VisitLog[];
};
