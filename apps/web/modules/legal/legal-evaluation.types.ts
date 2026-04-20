import type { LegalRiskEngineInput, LegalRiskEngineResult } from "./engine/legal-engine.service";
import type { BrokerEvaluationResult } from "./legal-rules.service";
import type { SellerFraudAnalysisResult } from "./legal-fraud.service";

export type ListingScope = "FSBO" | "BNHUB";

export type LegalEvaluationInput = LegalRiskEngineInput & {
  broker?: Partial<{
    brokerDisclosedSource: boolean;
    attemptedVerification: boolean;
    disclosureWarningIssued: boolean;
    sellerUncooperative: boolean;
    forwardedSellerInfoWithoutWarning: boolean;
    forwardedWithoutVerificationAttempt: boolean;
  }>;
  sellerFraud?: Partial<{
    listingDescription: string;
    sellerDeclarationJson: unknown;
    inspectionNotes: string | null;
    uploadedDocCategories: string[];
    sameSellerHighRiskListingCount: number;
  }>;
};

export type LegalEvaluationOutput = {
  engine: LegalRiskEngineResult;
  broker: BrokerEvaluationResult;
  sellerFraud: SellerFraudAnalysisResult;
  overallScore: number;
  overallRiskLevel: LegalRiskEngineResult["riskLevel"];
  recommendedActions: string[];
  complianceWarnings: string[];
};

export type PersistLegalEvaluationOptions = {
  listingScope: ListingScope;
  listingId: string;
  sellerUserId?: string | null;
  persistAlerts: boolean;
  actorUserId?: string | null;
};
