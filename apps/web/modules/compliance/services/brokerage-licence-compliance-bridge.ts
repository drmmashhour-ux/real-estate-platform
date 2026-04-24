import type { BrokerStatus, PlatformRole, VerificationStatus } from "@prisma/client";
import { buildOaciqLicenceContext, type BrokerageScopeInput } from "@/lib/compliance/oaciq/broker-licence-service";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";

type BridgeUser = {
  id: string;
  role: PlatformRole;
  brokerStatus: BrokerStatus;
  emailVerifiedAt: Date | null;
  isOaciqLicensed?: boolean;
  oaciqLicenseNumber?: string | null;
};

type BridgeProfile = { licenceType: string; licenceStatus: string } | null;

type BridgeVerification = { verificationStatus: VerificationStatus; licenseNumber: string } | null;

/**
 * Maps broker DB slice + scope into unified `ComplianceCaseContext.brokerageLicence` for the licence rule pack.
 */
export function attachBrokerageLicenceToComplianceCase(
  caseBase: ComplianceCaseContext,
  input: {
    user: BridgeUser;
    brokerVerification: BridgeVerification;
    profile: BridgeProfile;
    scope: BrokerageScopeInput;
  },
): ComplianceCaseContext {
  const ctx = buildOaciqLicenceContext({
    user: input.user,
    brokerVerification: input.brokerVerification,
    profile: input.profile,
    scope: input.scope,
  });

  const propertyClassificationUnclear =
    input.scope.dealType == null &&
    input.scope.transactionType == null &&
    input.scope.dwellingUnitCount == null;

  return {
    ...caseBase,
    brokerageLicence: {
      brokerIdentityVerified: ctx.verify_broker_identity === true,
      oaciqLicenceRecordVerified: ctx.verify_oaciq_licence_status === true,
      licenceCategoryResidential: ctx.verify_licence_category === true,
      licenceStatusActive: ctx.is_licence_active === true,
      brokerAttachedToTransaction: ctx.attach_broker_to_every_transaction === true,
      platformAcknowledgesAiAssistOnly: ctx.allow_ai_to_execute_legal_actions === false,
      transactionWithinResidentialScope: ctx.is_residential_scope_valid === true,
      propertyClassificationUnclear,
    },
  };
}
