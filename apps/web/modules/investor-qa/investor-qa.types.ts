/**
 * LECIPM investor Q&A stress test — training only, not legal or investment advice.
 */

export type InvestorQaCategory =
  | "market"
  | "product"
  | "legal"
  | "traction"
  | "gtm"
  | "risk";

export type InvestorQaQuestion = {
  id: string;
  category: InvestorQaCategory;
  question: string;
  /** Phrases a strong answer should address (heuristic coverage in feedback) */
  keyPoints: string[];
  /** Model answer for learning — 2–4 sentences, compliance-aware */
  modelAnswer: string;
};

export type PracticeMode = "random" | "category" | "rapid10";
