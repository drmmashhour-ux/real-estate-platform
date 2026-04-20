import { ImmovableCertificate } from "../types/immovable-certificate.types";

export function buildCertificateSummary(cert: ImmovableCertificate): string {
  return `
Building condition: ${cert.condition.level}
Deficiencies: ${cert.condition.deficiencies.join(", ") || "None"}
Interventions: ${cert.condition.interventions.join(", ") || "None"}

Financial:
Annual contribution: ${cert.financial.annualContribution ?? "N/A"}
Estimated work: ${cert.financial.estimatedWorkCost ?? "N/A"}

Conclusion:
${cert.conclusion.majorWork ? "Major work required" : ""}
${!cert.conclusion.fundSufficient ? "Fund insufficient" : ""}
`.trim();
}
