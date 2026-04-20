import type { ImmovableCertificate } from "../types/immovable-certificate.types";

function hasConditionSource(cert: ImmovableCertificate): boolean {
  return (
    cert.reportIncluded ||
    cert.source.buildingReport ||
    cert.source.contingencyStudy ||
    cert.source.maintenanceLog
  );
}

/**
 * Never treat condition as confirmed "GOOD" without at least one technical source flag.
 */
export function enforceProvisionalConditionCertificate(cert: ImmovableCertificate): ImmovableCertificate {
  if (hasConditionSource(cert)) return cert;

  if (cert.condition.level !== "GOOD") {
    return {
      ...cert,
      verification: {
        ...cert.verification,
        fullyVerified: false,
      },
    };
  }

  const note =
    "Grade was adjusted from GOOD to AVERAGE until supporting syndicate documents are attached.";
  return {
    ...cert,
    condition: {
      ...cert.condition,
      level: "AVERAGE",
      notes: cert.condition.notes ? `${cert.condition.notes}\n${note}` : note,
    },
    conclusion: {
      ...cert.conclusion,
      needsWork: true,
    },
    verification: {
      ...cert.verification,
      fullyVerified: false,
    },
  };
}
