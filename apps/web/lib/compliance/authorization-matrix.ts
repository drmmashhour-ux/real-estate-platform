type AuthorizationDecision =
  | { allowed: true; requiresApproval?: boolean; accountableActorType?: string }
  | { allowed: false; reason: string };

/** Final regulated steps — never executable as employee/assistant (Step 9). */
export const FINAL_NON_DELEGABLE_ACTIONS = [
  "publish_listing",
  "approve_contract",
  "release_deposit",
  "finalize_identity_verification",
  "close_high_risk_complaint",
  "seal_export_bundle",
  "open_inspection_session",
] as const;

function isLicenseActiveForRegulatedAction(actorType: string, licenseStatus: string | null | undefined): boolean {
  if (licenseStatus === "active") return true;
  if (["agency_admin", "agency_executive"].includes(actorType) && licenseStatus === "not_applicable") return true;
  return false;
}

const FINAL_ACTION_SET = new Set<string>(FINAL_NON_DELEGABLE_ACTIONS);

export function evaluateRoleAuthorization(input: {
  actorType: string;
  licenseStatus?: string | null;
  actionKey: string;
}): AuthorizationDecision {
  if (["employee", "assistant"].includes(input.actorType) && FINAL_ACTION_SET.has(input.actionKey)) {
    return { allowed: false, reason: "FINAL_REGULATED_ACTION_NOT_DELEGABLE" };
  }

  const licensed = isLicenseActiveForRegulatedAction(input.actorType, input.licenseStatus);

  if (
    [
      "publish_listing",
      "approve_contract",
      "submit_offer_as_broker",
      "release_deposit",
      "close_high_risk_complaint",
      "finalize_identity_verification",
    ].includes(input.actionKey)
  ) {
    if (!licensed && !["platform_admin"].includes(input.actorType)) {
      return { allowed: false, reason: "ACTIVE_LICENSE_REQUIRED" };
    }

    if (!["solo_broker", "broker", "agency_admin", "agency_executive", "platform_admin"].includes(input.actorType)) {
      return { allowed: false, reason: "ROLE_NOT_AUTHORIZED_FOR_REGULATED_ACTION" };
    }

    return { allowed: true };
  }

  if (
    [
      "prepare_listing",
      "draft_contract",
      "collect_documents",
      "prepare_complaint_file",
      "prepare_receipt_record",
      "prepare_disclosure_packet",
    ].includes(input.actionKey)
  ) {
    if (["employee", "assistant", "broker", "solo_broker", "agency_admin"].includes(input.actorType)) {
      return {
        allowed: true,
        requiresApproval: true,
        accountableActorType: "supervisor_or_broker",
      };
    }

    return { allowed: false, reason: "ROLE_NOT_AUTHORIZED_FOR_PREPARATORY_ACTION" };
  }

  if (["assign_review", "refer_complaint", "seal_export_bundle", "open_inspection_session"].includes(input.actionKey)) {
    if (["agency_admin", "agency_executive", "platform_admin", "broker", "solo_broker"].includes(input.actorType)) {
      return { allowed: true };
    }

    return { allowed: false, reason: "ROLE_NOT_AUTHORIZED_FOR_ADMIN_ACTION" };
  }

  return { allowed: false, reason: "ACTION_NOT_MAPPED" };
}
