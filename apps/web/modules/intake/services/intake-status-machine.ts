import type { ClientIntakeStatus, PlatformRole, RequiredDocumentStatus } from "@prisma/client";
import { isBrokerLikeRole } from "@/modules/offers/services/offer-access";

function isAdmin(role: PlatformRole): boolean {
  return role === "ADMIN";
}

export function getAllowedIntakeStatusTransitions(current: ClientIntakeStatus): ClientIntakeStatus[] {
  switch (current) {
    case "NOT_STARTED":
      return ["IN_PROGRESS", "ON_HOLD"];
    case "IN_PROGRESS":
      return ["UNDER_REVIEW", "COMPLETE", "ON_HOLD", "NOT_STARTED"];
    case "UNDER_REVIEW":
      return ["COMPLETE", "IN_PROGRESS", "ON_HOLD", "NOT_STARTED"];
    case "COMPLETE":
      return ["IN_PROGRESS", "ON_HOLD"];
    case "ON_HOLD":
      return ["NOT_STARTED", "IN_PROGRESS", "UNDER_REVIEW"];
    default:
      return [];
  }
}

/** Intake status changes are broker/admin only (enforced in routes). */
export function canTransitionIntakeStatus(
  current: ClientIntakeStatus,
  next: ClientIntakeStatus,
  actorRole: PlatformRole
): boolean {
  if (!getAllowedIntakeStatusTransitions(current).includes(next)) return false;
  return isAdmin(actorRole) || isBrokerLikeRole(actorRole);
}

export function getAllowedDocumentStatusTransitions(
  current: RequiredDocumentStatus
): RequiredDocumentStatus[] {
  switch (current) {
    case "REQUIRED":
      return ["REQUESTED", "UPLOADED", "WAIVED"];
    case "REQUESTED":
      return ["UPLOADED", "WAIVED", "REQUIRED"];
    case "UPLOADED":
      return ["UNDER_REVIEW", "APPROVED", "REJECTED"];
    case "UNDER_REVIEW":
      return ["APPROVED", "REJECTED", "UPLOADED"];
    case "APPROVED":
      return ["WAIVED"];
    case "REJECTED":
      return ["REQUESTED", "UPLOADED", "UNDER_REVIEW"];
    case "WAIVED":
      return ["REQUIRED"];
    default:
      return [];
  }
}

export function canTransitionRequiredDocumentStatus(
  current: RequiredDocumentStatus,
  next: RequiredDocumentStatus,
  actorRole: PlatformRole,
  opts: { isBrokerOrAdmin: boolean; isClient: boolean }
): boolean {
  if (!getAllowedDocumentStatusTransitions(current).includes(next)) return false;

  const brokerOrAdmin = opts.isBrokerOrAdmin || isAdmin(actorRole);

  if (next === "WAIVED" || next === "APPROVED" || next === "REJECTED") {
    return brokerOrAdmin;
  }
  if (next === "REQUESTED" || next === "UNDER_REVIEW") {
    return brokerOrAdmin;
  }
  if (next === "UPLOADED") {
    return opts.isClient || brokerOrAdmin;
  }
  if (next === "REQUIRED") {
    return brokerOrAdmin;
  }
  return brokerOrAdmin;
}
