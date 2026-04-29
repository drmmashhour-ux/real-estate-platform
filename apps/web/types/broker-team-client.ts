/** Broker collaboration / teams — mirrored enums and minimal shapes. */

export type BrokerTeamMemberRole =
  | "owner"
  | "admin"
  | "broker"
  | "assistant"
  | "coordinator"
  | "analyst"
  | "reviewer";

export type BrokerTeamMemberStatus = "invited" | "active" | "suspended";

/** Minimal assignment stub for deal board counts. */
export type BrokerDealAssignmentView = { id: string };

export type BrokerTeamMemberView = {
  id: string;
  userId: string;
  role: BrokerTeamMemberRole;
  status: BrokerTeamMemberStatus;
};

export type BrokerTeamView = {
  id: string;
  name: string;
  members: BrokerTeamMemberView[];
};
