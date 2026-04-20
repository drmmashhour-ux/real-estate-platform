/**
 * Immovable ("Certificate of the State of the Immovable") — domain types.
 * Bilingual presentation (FR/EN) is handled at PDF/UI layers; core model is locale-agnostic.
 */

export type CertificateConditionLevel =
  | "GOOD"
  | "SATISFACTORY"
  | "AVERAGE"
  | "INTERVENTION_REQUIRED"
  | "CRITICAL";

export interface ImmovableCertificate {
  id: string;

  syndicateName: string;
  buildingAddress: string;
  fileNumber?: string;
  date: string;

  source: {
    buildingReport: boolean;
    contingencyStudy: boolean;
    maintenanceLog: boolean;
    other?: string;
  };

  reportIncluded: boolean;

  condition: {
    level: CertificateConditionLevel;
    deficiencies: string[];
    interventions: string[];
    notes?: string;
  };

  workHorizon: {
    shortTerm: boolean;
    mediumTerm: boolean;
    longTerm: boolean;
  };

  financial: {
    annualContribution?: number;
    monthlyContribution?: number;
    estimatedWorkCost?: number;
    specialAssessments?: number;
    scenarios?: {
      fast?: number;
      progressive?: number;
    };
  };

  conclusion: {
    needsWork: boolean;
    majorWork: boolean;
    fundSufficient: boolean;
  };

  verification: {
    fullyVerified: boolean;
    notes?: string;
  };

  createdAt: string;
}
