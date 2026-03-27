import type { BrokerClient, PlatformRole, RequiredDocumentItem, User } from "@prisma/client";

type MinimalUser = Pick<User, "id" | "role">;

function isAdmin(role: PlatformRole): boolean {
  return role === "ADMIN";
}

function ownsBrokerClient(userId: string, bc: Pick<BrokerClient, "brokerId">): boolean {
  return bc.brokerId === userId;
}

function isLinkedClient(userId: string, bc: Pick<BrokerClient, "userId">): boolean {
  return bc.userId != null && bc.userId === userId;
}

export function canViewIntakeProfile(
  user: MinimalUser,
  brokerClient: Pick<BrokerClient, "brokerId" | "userId">
): boolean {
  if (isAdmin(user.role)) return true;
  if (ownsBrokerClient(user.id, brokerClient)) return true;
  if (isLinkedClient(user.id, brokerClient)) return true;
  return false;
}

/** Broker/admin can edit all fields; client can edit only their own linked profile (routes restrict fields). */
export function canEditIntakeProfile(
  user: MinimalUser,
  brokerClient: Pick<BrokerClient, "brokerId" | "userId">
): boolean {
  if (isAdmin(user.role)) return true;
  if (ownsBrokerClient(user.id, brokerClient)) return true;
  if (isLinkedClient(user.id, brokerClient)) return true;
  return false;
}

export function canManageRequiredDocuments(
  user: MinimalUser,
  brokerClient: Pick<BrokerClient, "brokerId">
): boolean {
  return isAdmin(user.role) || ownsBrokerClient(user.id, brokerClient);
}

export function canUploadForRequiredDocument(
  user: MinimalUser,
  brokerClient: Pick<BrokerClient, "id" | "brokerId" | "userId">,
  item: Pick<RequiredDocumentItem, "brokerClientId" | "deletedAt">
): boolean {
  if (item.deletedAt != null) return false;
  if (item.brokerClientId !== brokerClient.id) return false;
  if (isAdmin(user.role)) return true;
  if (ownsBrokerClient(user.id, brokerClient)) return true;
  if (isLinkedClient(user.id, brokerClient)) return true;
  return false;
}

/** Approve / reject / waive — broker or admin only (never the end client). */
export function canReviewRequiredDocument(
  user: MinimalUser,
  brokerClient: Pick<BrokerClient, "brokerId">
): boolean {
  return canManageRequiredDocuments(user, brokerClient);
}
