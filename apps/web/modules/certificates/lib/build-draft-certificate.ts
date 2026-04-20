import type { ImmovableCertificate } from "../types/immovable-certificate.types";

/**
 * Draft payload from minimal admin form input.
 * Never assigns an optimistic condition grade without syndicate sources — defaults are provisional (AVERAGE).
 */
export function buildDraftCertificatePayload(input: {
  syndicateName: string;
  buildingAddress: string;
}): ImmovableCertificate {
  const now = new Date().toISOString();
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `cert-${Date.now()}`,
    syndicateName: input.syndicateName,
    buildingAddress: input.buildingAddress,
    date: now.slice(0, 10),
    source: {
      buildingReport: false,
      contingencyStudy: false,
      maintenanceLog: false,
    },
    reportIncluded: false,
    condition: {
      level: "AVERAGE",
      deficiencies: [],
      interventions: [],
      notes:
        "Condition classification is provisional — attach building report, contingency study, maintenance log, or filed certificate before confirming grade.",
    },
    workHorizon: { shortTerm: false, mediumTerm: false, longTerm: false },
    financial: {},
    conclusion: {
      needsWork: true,
      majorWork: false,
      fundSufficient: false,
    },
    verification: {
      fullyVerified: false,
      notes: "Awaiting syndicate technical sources.",
    },
    createdAt: now,
  };
}
