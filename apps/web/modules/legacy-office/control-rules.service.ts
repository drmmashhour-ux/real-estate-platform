/**
 * Governance / control tracking — user-editable notes only. Not legal advice.
 */

export type ControlRules = {
  entityId: string;
  votingControlNotes?: string | null;
  reservedMattersNotes?: string | null;
  capitalAllocationAuthorityNotes?: string | null;
  successionNotes?: string | null;
  boardOrManagerRolesNotes?: string | null;
};

export function emptyControlRules(entityId: string): ControlRules {
  return {
    entityId,
    votingControlNotes: "",
    reservedMattersNotes: "",
    capitalAllocationAuthorityNotes: "",
    successionNotes: "",
    boardOrManagerRolesNotes: "",
  };
}

export function getControlRulesForEntity(rules: ControlRules[], entityId: string): ControlRules | undefined {
  return rules.find((r) => r.entityId === entityId);
}

/** Merge: prefer stored row; fill missing keys with empty strings for form binding. */
export function resolveControlRules(rules: ControlRules[], entityId: string): ControlRules {
  const found = getControlRulesForEntity(rules, entityId);
  if (found) return { ...emptyControlRules(entityId), ...found, entityId };
  return emptyControlRules(entityId);
}

export function upsertControlRules(rules: ControlRules[], next: ControlRules): ControlRules[] {
  const idx = rules.findIndex((r) => r.entityId === next.entityId);
  if (idx < 0) return [...rules, next];
  const copy = [...rules];
  copy[idx] = next;
  return copy;
}
