/**
 * Timeline / staleness hints — advisory only.
 */

import type { CertificateOfLocationContext, CertificateOfLocationParsedData, CertificateOfLocationTimelineSignals } from "./certificate-of-location.types";
import { CERTIFICATE_LOCATION_V2_CONFIG } from "./certificate-of-location-v2.config";
import { parseIsoDateBoundary } from "./certificate-of-location-helpers";

export function buildCertificateTimelineSignals(
  parsedData: CertificateOfLocationParsedData,
  context: CertificateOfLocationContext,
): CertificateOfLocationTimelineSignals {
  try {
    const issueMs = parseIsoDateBoundary(parsedData.issueDate ?? null);
    const hasIssueDate = issueMs !== null;
    let estimatedAgeDays: number | null = null;
    if (issueMs !== null) {
      estimatedAgeDays = Math.max(0, Math.floor((Date.now() - issueMs) / 86_400_000));
    }

    let flaggedAsPotentiallyOutdated = false;
    if (context.changedSinceCertificate === true) {
      flaggedAsPotentiallyOutdated = true;
    }
    if (estimatedAgeDays !== null && estimatedAgeDays >= CERTIFICATE_LOCATION_V2_CONFIG.outdatedAgeDaysStrong) {
      flaggedAsPotentiallyOutdated = true;
    } else if (estimatedAgeDays !== null && estimatedAgeDays >= CERTIFICATE_LOCATION_V2_CONFIG.outdatedAgeDaysWarning) {
      flaggedAsPotentiallyOutdated = true;
    }

    return {
      hasIssueDate,
      estimatedAgeDays,
      flaggedAsPotentiallyOutdated,
    };
  } catch {
    return {
      hasIssueDate: false,
      estimatedAgeDays: null,
      flaggedAsPotentiallyOutdated: context.changedSinceCertificate === true,
    };
  }
}
