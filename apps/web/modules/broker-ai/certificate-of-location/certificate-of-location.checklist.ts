/**
 * Deterministic checklist definitions — platform readiness only (not legal conclusions).
 */

import type { CertificateOfLocationChecklistItem, CertificateOfLocationContext } from "./certificate-of-location.types";

export function getCertificateOfLocationChecklist(context: CertificateOfLocationContext): CertificateOfLocationChecklistItem[] {
  const offer = context.offerStage === true;
  const broker = context.brokerFlow === true;

  return [
    {
      id: "certificate_document_present",
      label: "Certificate document present",
      description: "A certificate-of-location-class compliance record or certificate slot signal is present in the platform.",
      required: true,
      blocking: true,
      severity: "critical",
    },
    {
      id: "document_type_matches_certificate_of_location",
      label: "Document type matches certificate of location",
      description: "Structured metadata indicates a certificate of location class document (type label match only).",
      required: true,
      blocking: true,
      severity: "critical",
    },
    {
      id: "property_identification_present",
      label: "Property identification fields present",
      description: "Parsed metadata includes cadastre or parcel reference where captured (no manual survey).",
      required: false,
      blocking: false,
      severity: "warning",
    },
    {
      id: "issue_or_reference_date_present",
      label: "Issue or reference date present",
      description: "Issue date or equivalent reference date is present in structured fields for staleness review.",
      required: true,
      blocking: false,
      severity: "warning",
    },
    {
      id: "owner_or_property_link_present",
      label: "Owner or property link present",
      description: "Ownership or property linkage hints exist in parsed fields when provided.",
      required: false,
      blocking: false,
      severity: "info",
    },
    {
      id: "no_critical_validation_failures",
      label: "No critical validation failures",
      description: "Legal record validation shows no critical rule failures for the certificate record.",
      required: true,
      blocking: true,
      severity: "critical",
    },
    {
      id: "broker_manual_review_ready",
      label: "Manual review recommended completed or scheduled",
      description: "Broker or admin review path is appropriate before relying on listing collateral.",
      required: broker || offer,
      blocking: false,
      severity: "warning",
    },
    {
      id: "change_since_certificate_reviewed",
      label: "Property change since certificate reviewed",
      description: "If changes since issuance are flagged, additional verification is tracked.",
      required: false,
      blocking: false,
      severity: "warning",
    },
    {
      id: "update_may_be_required_if_property_changed",
      label: "Update may be required if property changed",
      description: "When structural change is indicated, document refresh may be required — manual review recommended.",
      required: false,
      blocking: false,
      severity: "warning",
    },
  ];
}
