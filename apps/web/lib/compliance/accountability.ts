type ResolveAccountabilityInput = {
  actorId: string;
  actorType: string;
  ownerType: string;
  ownerId: string;
  actionKey: string;
  supervisorActorId?: string | null;
  approvalActorId?: string | null;
  delegated?: boolean;
};

export function resolveAccountableActor(input: ResolveAccountabilityInput) {
  if (["solo_broker", "broker", "agency_admin", "agency_executive", "platform_admin"].includes(input.actorType)) {
    return {
      accountableActorId: input.actorId,
      supervisorActorId: input.supervisorActorId ?? null,
    };
  }

  if (["employee", "assistant"].includes(input.actorType)) {
    return {
      accountableActorId: input.approvalActorId || input.supervisorActorId || input.actorId,
      supervisorActorId: input.supervisorActorId || null,
    };
  }

  return {
    accountableActorId: input.actorId,
    supervisorActorId: input.supervisorActorId ?? null,
  };
}
