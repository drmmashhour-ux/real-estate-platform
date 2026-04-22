/**
 * OACIQ-oriented solo broker compliance layer (non-agency adaptation).
 * Use with existing `brokerVerificationLog`, legal hub, and role guards — not a substitute for legal counsel.
 */

export {
  COMPLIANCE_OPTIONAL,
  COMPLIANCE_REQUIRED,
  PLATFORM_COMPLIANCE_ROLE,
  type PlatformComplianceStance,
} from "./constants";

export {
  AI_COMPLIANCE_ROLE,
  type AiComplianceRole,
  type BrokerOnlyAction,
  type BrokerVerificationVector,
  type ComplianceGateOutcome,
  type ComplianceLogCategory,
  type ComplianceRiskTier,
  type EducationTrigger,
  type SoloBrokerAuditFields,
  type SoloBrokerEducationModuleId,
} from "./types";

export {
  BROKER_RESPONSIBILITY_CRITICAL,
  PLATFORM_LEGAL_NOTICE_SOLO_BROKER,
  brokerResponsibilityLine,
  platformLegalNoticeLine,
  type SupportedLegalLocale,
} from "./messages";

export { SOLO_BROKER_EDUCATION_MODULES, type EducationModuleDefinition } from "./education-catalog";

export {
  BROKER_ONLY_ACTIONS,
  classifyRiskTier,
  confirmationStrength,
  evaluateBrokerOnlyGate,
  evaluateLicenceAccessGate,
  evaluateVerificationSoftGate,
  isBrokerOnlyAction,
  requiresBrokerAcknowledgement,
} from "./engine";
