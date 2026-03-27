export type AiRiskLevel = "low" | "medium" | "high";

export type AiListingInsight = {
  listingId: string;
  trustScore: number | null;
  dealScore: number | null;
  riskLevel: AiRiskLevel;
  recommendations: string[];
  explanations: string[];
};

export type AiLeadInsight = {
  leadId: string;
  leadScore: number;
  predictedCloseLikelihood: number;
  urgency: number;
  recommendations: string[];
  autoMessages: {
    followUp: string;
    reply: string;
    summary: string;
  };
};

export type AiSeoPayload = {
  title: string;
  description: string;
  headings: string[];
  keywords: string[];
  bodyPreview: string;
};
