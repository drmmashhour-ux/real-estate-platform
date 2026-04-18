export type BrokerPressureScriptType = "activation" | "urgency" | "performance" | "followup";

export type BrokerPressureScript = {
  type: BrokerPressureScriptType;
  message: string;
};
