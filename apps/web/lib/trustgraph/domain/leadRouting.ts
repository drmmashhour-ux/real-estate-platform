export type BrokerRoutingCandidate = {
  userId: string;
  brokerStatus: string;
  createdAt: Date;
};

export type BrokerRoutingFactor = {
  userId: string;
  routingScore: number;
  trustScoreComponent: number;
  verificationBonus: number;
  licenseRulePass: boolean;
};

export type TrustAwareLeadRoutingResult = {
  recommendedBrokerIds: string[];
  routingFactors: BrokerRoutingFactor[];
  trustContribution: number;
  fallbackReason: string | null;
};
