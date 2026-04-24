export type ContractBrainPartyRole = "BUYER" | "SELLER" | "TENANT" | "LANDLORD";

/** Client-supplied transaction context for notice eligibility (never trust alone for signing — contract.content carries persisted keys). */
export type ContractBrainContext = {
  isBuyerRepresented?: boolean;
  isSellerRepresented?: boolean;
  isTenantRepresented?: boolean;
  role?: ContractBrainPartyRole;
};

export type ContractBrainContentMeta = {
  requiredNoticeKeys: string[];
  snapshotVersionByKey?: Record<string, string>;
};
