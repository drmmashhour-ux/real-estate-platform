import type { PlatformRole } from "@prisma/client";

type BrokerScope = { brokerId: string };

type Viewer = { id: string; role: PlatformRole };

/** Brokers see only their CRM rows; admins see all. */
export function canViewBrokerClient(user: Viewer, brokerClient: BrokerScope): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "BROKER" && brokerClient.brokerId === user.id;
}

export function canManageBrokerClient(user: Viewer, brokerClient: BrokerScope): boolean {
  return canViewBrokerClient(user, brokerClient);
}

export function canDeleteBrokerClient(user: Viewer, brokerClient: BrokerScope): boolean {
  return canViewBrokerClient(user, brokerClient);
}
