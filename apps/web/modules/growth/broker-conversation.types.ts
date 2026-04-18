export type BrokerConversationStage = "handoff" | "activation" | "urgency" | "closing";

export type BrokerConversationStep = {
  stage: BrokerConversationStage;
  message: string;
};
