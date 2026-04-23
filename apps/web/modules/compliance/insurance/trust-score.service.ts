import { isBrokerInsuranceValid, getComplianceScoreForBroker } from "./insurance.service";
import { evaluateBrokerInsuranceRisk } from "./insurance-risk.engine";

export type TrustScoreResult = {
  trustScore: number; // 0 to 1
  insuranceValid: boolean;
  complianceScore: number; // 0 to 100
  riskScore: number; // 0 to 100
};

export async function computeBrokerTrustScore(brokerId: string): Promise<TrustScoreResult> {
  const [insuranceValid, complianceData, riskData] = await Promise.all([
    isBrokerInsuranceValid(brokerId),
    getComplianceScoreForBroker(brokerId),
    evaluateBrokerInsuranceRisk({ brokerId }),
  ]);

  // Normalize scores to 0-1
  const compliance01 = complianceData.score / 100;
  const risk01 = 1 - (riskData.riskScore / 100); // Inverse of risk
  const insuranceBonus = insuranceValid ? 1 : 0;

  // Blended score
  // 40% insurance, 30% compliance, 30% risk
  const blended = (insuranceBonus * 0.4) + (compliance01 * 0.3) + (risk01 * 0.3);

  return {
    trustScore: Math.max(0, Math.min(1, blended)),
    insuranceValid,
    complianceScore: complianceData.score,
    riskScore: riskData.riskScore,
  };
}
