export type BrokerChannel = "instagram" | "linkedin" | "facebook" | "direct_call";

export type BrokerAcquisitionLeadStatus =
  | "not_contacted"
  | "contacted"
  | "replied"
  | "interested"
  | "converted";

export type BrokerScript = {
  id: string;
  channel: BrokerChannel;
  title: string;
  /** Use [CITY] placeholder; replace before sending. */
  message: string;
};

export type BrokerAcquisitionLead = {
  id: string;
  name?: string;
  channel: BrokerChannel;
  status: BrokerAcquisitionLeadStatus;
  notes?: string;
  createdAt: string;
};
