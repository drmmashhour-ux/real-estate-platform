export type BrokerDealScriptType = "handoff" | "urgency" | "followup" | "closing";

export type BrokerDealScript = {
  type: BrokerDealScriptType;
  message: string;
};
