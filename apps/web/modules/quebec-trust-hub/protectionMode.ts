import { TurboDraftInput, TurboDraftResult } from "../turbo-form-drafting/types";
import { ProtectionModeStatus } from "./types";

export function getProtectionModeStatus(input: TurboDraftInput, result: TurboDraftResult): ProtectionModeStatus {
  const reasonsFr: string[] = [];
  const recommendedActionsFr: string[] = [];

  if (input.representedStatus === "NOT_REPRESENTED") {
    reasonsFr.push("Acheteur non représenté");
    recommendedActionsFr.push("Consulter un courtier avant de signer");
  }

  if (input.answers.withoutWarranty) {
    reasonsFr.push("Vente sans garantie légale");
    recommendedActionsFr.push("Effectuer une inspection préachat exhaustive");
  }

  // @ts-ignore
  if (result.styleValidation?.clauses.some((c: any) => c.severity === "CRITICAL")) {
    reasonsFr.push("Anomalies de rédaction critiques");
    recommendedActionsFr.push("Réviser les clauses signalées par l'IA");
  }

  return {
    enabled: reasonsFr.length > 0,
    reasonsFr,
    recommendedActionsFr
  };
}
